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

export interface Order<T extends LineItem & Product> {
  total: number;
  totalWeight: number;
  lineItems: T[];
  priceScore?: number;
  weightScore?: number;
  score?: number;
}

export interface ConstraintOrder {
  subtotalLimit: number;
  subtotalLimitBottomPadding: number;
  freeShipMinSp: number;
  maximumWeightTotal: number;
  underFreeShipTolerance: number;
}

function getNextItemsOrder<P extends Product, T extends LineItem & Product>(
  currThreshold: number,
  nextProducts: P[],
  constraintOrder: ConstraintOrder
): T[][] {
  const { subtotalLimit, freeShipMinSp, underFreeShipTolerance } =
    constraintOrder;

  if (nextProducts.length === 0) return [];

  const currItem = nextProducts[0];
  const spendRemain = subtotalLimit - currThreshold;

  // get maximum number current can order
  let maxCurrNumItem = Math.min(
    Math.floor(spendRemain / currItem.price),
    currItem.quantityLimit
  );

  if (maxCurrNumItem === 0) return [];

  let currItemsOrder: T[][] = [];

  while (maxCurrNumItem >= 0) {
    const newThreshold = currThreshold + maxCurrNumItem * currItem.price;
    // allow premature order
    if (newThreshold >= freeShipMinSp - underFreeShipTolerance)
      currItemsOrder.push([
        {
          ...(currItem as any),
          quantity: maxCurrNumItem,
        },
      ]);

    // get next items
    const nextItemsOrder = getNextItemsOrder<P, T>(
      newThreshold,
      nextProducts.slice(1),
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
              ...(currItem as any),
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
  // it mean that all item have same weight or just one 1 item
  // so we score all be zero
  if (minWeight === maxWeight) return 0;
  // the smaller the weight the better order
  return (1 - (totalWeight - minWeight) / (maxWeight - minWeight)) * 100;
}

export function scoreOrders<T extends LineItem & Product>(
  orders: Order<T>[],
  freeShipMinSp: number,
  priceRatio = 0.7
): Order<T>[] {
  // no orders so just return empty
  if (orders.length <= 0) return [];
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

export default function generateOptimizeOrders<
  P extends Product,
  T extends LineItem & Product
>(products: P[], constraintOrder: ConstraintOrder): Order<T>[] {
  const {
    subtotalLimit,
    freeShipMinSp,
    underFreeShipTolerance,
    maximumWeightTotal,
    subtotalLimitBottomPadding,
  } = constraintOrder;
  // sort the list first
  products.sort((a, b) => a.price - b.price);

  let orders: Order<T>[] = [];

  let rawOrders: T[][] = [];

  for (const item of products) {
    // get maximum number current can order but can't over order limit
    let maxNumItem = Math.min(
      Math.floor(subtotalLimit / item.price),
      item.quantityLimit
    );

    while (maxNumItem > 0) {
      const newThreshold = item.price * maxNumItem;

      const index = products.indexOf(item);

      const currNumItem = maxNumItem;
      // allow premature order
      if (newThreshold >= freeShipMinSp - underFreeShipTolerance)
        rawOrders.push([
          {
            ...(item as any),
            quantity: currNumItem,
          },
        ]);

      // get remain products in list
      const nextItemsOrder = getNextItemsOrder<P, T>(
        newThreshold,
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
          ...(item as any),
          quantity: currQuantity,
        });
        return x;
      });

      rawOrders = [...rawOrders, ...mergeItemsOrder];

      maxNumItem--;
    }
  }

  // refer data
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

  // shrink orders with filter orver weight and over upper total limit
  orders = orders.filter(
    (order) =>
      order.totalWeight <= maximumWeightTotal &&
      order.total <= subtotalLimit - subtotalLimitBottomPadding
  );

  orders = scoreOrders(orders, freeShipMinSp, 0.7);

  orders = orders.sort((a, b) => b.score! - a.score!);

  return orders;
}
