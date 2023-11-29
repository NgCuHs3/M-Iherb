export interface BaseItem {
  productId: number;
  price: number;
  weight: number;
}

export interface Product extends BaseItem {
  quantityLimit: number;
}

export interface LineItem extends BaseItem {
  quantity: number;
}

export interface Order {
  total: number;
  totalWeight: number;
  lineItems: LineItem[];
  priceScore?: number;
  weightScore?: number;
  score?: number;
}

export interface ConstraintOrder {
  subtotalLimit: number;
  freeShipMinSp: number;
  underFreeShipTolerance: number;
}

function getNextItemsOrder(
  currThreshold: number,
  nextItems: Product[],
  constraintOrder: ConstraintOrder
): LineItem[][] {
  const { subtotalLimit, freeShipMinSp, underFreeShipTolerance } =
    constraintOrder;

  if (nextItems.length === 0) return [];

  const currItem = nextItems[0];
  const spendRemain = subtotalLimit - currThreshold;

  // get maximum number current can order
  let maxCurrNumItem = Math.min(
    Math.floor(spendRemain / currItem.price),
    currItem.quantityLimit
  );

  if (maxCurrNumItem === 0) return [];

  let currItemsOrder: LineItem[][] = [];

  while (maxCurrNumItem >= 0) {
    const newThreshold = currThreshold + maxCurrNumItem * currItem.price;
    // allow premature order
    if (newThreshold >= freeShipMinSp - underFreeShipTolerance)
      currItemsOrder.push([
        {
          ...currItem,
          quantity: maxCurrNumItem,
        },
      ]);

    // get next items
    const nextItemsOrder = getNextItemsOrder(
      newThreshold,
      nextItems.slice(1),
      constraintOrder
    );

    if (nextItemsOrder.length === 0) {
      maxCurrNumItem--;
      continue;
    }

    const currQuantity = maxCurrNumItem;

    // only merge when number of current item large than 0 else we don't
    const mergeItemsOrder =
      maxCurrNumItem > 0
        ? nextItemsOrder.map((x) => {
            x.unshift({
              ...currItem,
              quantity: currQuantity,
            });
            return x;
          })
        : nextItemsOrder;

    currItemsOrder = [...currItemsOrder, ...mergeItemsOrder];

    maxCurrNumItem--;
  }

  return currItemsOrder;
}

function scoreTotalPrice(
  total: number,
  minTotal: number,
  maxTotal: number,
  freeShipMinSp: number
): number {
  const overThres = total - freeShipMinSp;
  let score = 0;

  // case total surpass free shipMin
  if (overThres >= 0) {
    score = (1 - overThres / (maxTotal - freeShipMinSp)) * 100;
    return score;
  }

  if (minTotal >= freeShipMinSp) return 0;

  // with the total under freeShiping we penalty it with coefficient
  // I don't sure this score method we need improve it more

  const COEFF_PENALTY = 1 / 5;

  score = (-overThres / (freeShipMinSp - minTotal)) * COEFF_PENALTY;

  // score can't be negative
  return Math.max(0, score);
}

function scoreWeight(
  totalWeight: number,
  minWeight: number,
  maxWeight: number
): number {
  // the smaller the weight the better order
  return (1 - (totalWeight - minWeight) / (maxWeight - minWeight)) * 100;
}

function scoreOrders(
  orders: Order[],
  freeShipMinSp: number,
  priceRatio = 0.7
): Order[] {
  // the order score base on 2 metrics price and weight
  // the price - free shipping large than zero but near zero is more good
  // the smaller the weight, the better
  // contribute to score by priceRatio
  const { minTotal, maxTotal } = orders.reduce(
    (result, order) => {
      // Update minimum total
      result.minTotal = Math.min(result.minTotal, order.total);
      // Update maximum total
      result.maxTotal = Math.max(result.maxTotal, order.total);
      return result;
    },
    { minTotal: orders[0].total, maxTotal: orders[0].total }
  );

  const { minWeight, maxWeight } = orders.reduce(
    (result, order) => {
      // Update minimum total
      result.minWeight = Math.min(result.minWeight, order.totalWeight);
      // Update maximum total
      result.maxWeight = Math.max(result.maxWeight, order.totalWeight);

      return result;
    },
    { minWeight: orders[0].totalWeight, maxWeight: orders[0].totalWeight }
  );

  orders = orders.map((o) => {
    const priceScore = scoreTotalPrice(
      o.total,
      minTotal,
      maxTotal,
      freeShipMinSp
    );
    const weightScore = scoreWeight(o.totalWeight, minWeight, maxWeight);

    const finalScore = priceScore * priceRatio + weightScore * (1 - priceRatio);

    return {
      ...o,
      priceScore: priceScore,
      weightScore: weightScore,
      score: finalScore,
    };
  });

  return orders;
}

export default function generateOptimizeOrders(
  products: Product[],
  constraintOrder: ConstraintOrder
): Order[] {
  const { subtotalLimit, freeShipMinSp } = constraintOrder;
  // sort the list first
  products.sort((a, b) => a.price - b.price);

  let orders: Order[] = [];

  let rawOrders: LineItem[][] = [];

  for (const item of products) {
    // get maximum number current can order but can't over order limit
    let maxNumItem = Math.min(
      Math.floor(subtotalLimit / item.price),
      item.quantityLimit
    );

    while (maxNumItem > 0) {
      const remainThreshold = item.price * maxNumItem;

      const index = products.indexOf(item);

      // get remain products in list
      const nextItemsOrder = getNextItemsOrder(
        remainThreshold,
        products.slice(index + 1),
        constraintOrder
      );

      // don't have next items so continue
      if (nextItemsOrder.length === 0) {
        maxNumItem--;
        continue;
      }

      const currQuantity = maxNumItem;

      const mergeItemsOrder = nextItemsOrder.map((x) => {
        x.unshift({
          ...item,
          quantity: currQuantity,
        });
        return x;
      });

      rawOrders = [...rawOrders, ...mergeItemsOrder];

      maxNumItem--;
    }
  }
  // enrich data
  orders = rawOrders.map((order) => {
    return {
      total: order.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      totalWeight: order.reduce(
        (total, item) => total + item.weight * item.quantity,
        0
      ),
      lineItems: order,
    };
  });

  orders = scoreOrders(orders, freeShipMinSp, 0.7);

  orders = orders.sort((a, b) => b.score! - a.score!);

  return orders;
}
