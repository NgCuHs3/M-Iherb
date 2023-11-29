const util = require('util');

const freeShipMinSp = 948000;
const subtotalLimit = 1063733;
const underFreeShipTolerance = 100000;

const products = [
    {
        name: "NOW Foods, Magnesium Caps, 400 mg, 180 Veg Capsules",
        price: 388778,
        quantityLimit: 3,
        weight: 0.26,
    },
    {
        name: "NOW Foods, Ultra Omega-3 Fish Oil, 90 Softgels",
        price: 352870,
        quantityLimit: 3,
        weight: 0.17
    },
    {
        name: "California Gold Nutrition, Omega-3 Premium Fish Oil, 180 EPA / 120 DHA, 100 Fish Gelatin Softgels",
        price: 238402,
        quantityLimit: 3,
        weight: 0.18
    },
    {
        name: "Solaray, Tongkat Ali, 400 mg, 60 VegCaps",
        price: 203413,
        quantityLimit: 3,
        weight: 0.06
    },
    {
        name: "NOW Foods, Zinc, 50 mg, 250 Tablets",
        price: 223308,
        quantityLimit: 3,
        weight: 0.16
    }
]



function getNextItemsOrder(currThreshold, nextItems, underFreeShipTolerance) {

    if (nextItems.length === 0) return []

    const currItem = nextItems[0];
    const spendRemain = subtotalLimit - currThreshold;

    // get maximum number current can order
    let maxCurrNumItem =
        Math.min(
            Math.floor(spendRemain / currItem.price),
            currItem.quantityLimit);

    if (maxCurrNumItem === 0) return [];

    let currItemsOrder = []

    while (maxCurrNumItem >= 0) {
        const newThreshold = currThreshold + maxCurrNumItem * currItem.price;
        // allow premature order
        if (newThreshold >= freeShipMinSp - underFreeShipTolerance) currItemsOrder.push([{
            ...currItem,
            quantity: maxCurrNumItem
        }])

        // get next items
        const nextItemsOrder = getNextItemsOrder(newThreshold, nextItems.slice(1))

        if (nextItemsOrder.length === 0) {
            maxCurrNumItem--;
            continue;
        }

        const currQuantity = maxCurrNumItem;

        // only merge when number of current item large than 0 else we don't
        const mergeItemsOrder = maxCurrNumItem > 0 ?
            nextItemsOrder.map(x => {
                x.unshift({
                    ...currItem,
                    quantity: currQuantity
                })
                return x;
            }) :
            nextItemsOrder;

        currItemsOrder = [...currItemsOrder, ...mergeItemsOrder]

        maxCurrNumItem--;
    }

    return currItemsOrder;

}

function scoreTotalPrice(total, minTotal, maxTotal, freeShipMinSp) {
    const overThres = total - freeShipMinSp;
    let score = 0;

    // case total surpass free shipMin
    if (overThres >= 0) {
        score = (1 - overThres / (maxTotal - freeShipMinSp)) * 100;
        return score;
    }

    if (minTotal >= freeShipMinSp) return;

    // with the total under freeShiping we penalty it with coefficient
    // I don't sure this score method we need improve it more

    const COEFF_PENALTY = 1 / 5;

    score = -overThres / (freeShipMinSp - minTotal) * COEFF_PENALTY;

    // score can't be negative
    return score;
}

function scoreWeight(totalWeight, minWeight, maxWeight) {
    // the smaller the weight the better order
    return (1 - (totalWeight - minWeight) / (maxWeight - minWeight)) * 100;
}

function scoreOrders(orders, freeShipMinSp, priceRatio = 0.7) {
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

    orders = orders.map(o => {
        const priceScore = scoreTotalPrice(o.total, minTotal, maxTotal, freeShipMinSp)
        const weightScore = scoreWeight(o.totalWeight, minWeight, maxWeight)

        const finalScore = priceScore * priceRatio + weightScore * (1 - priceRatio);

        return {
            ...o,
            priceScore: priceScore,
            weightScore: weightScore,
            score: finalScore
        }
    })

    return orders;
}

function generateOptimizeOrders(products, subtotalLimit, freeShipMinSp, underFreeShipTolerance) {

    // sort the list first
    products.sort((a, b) => a.price - b.price);

    let orders = []

    let rawOrders = [];

    for (const item of products) {
        // get maximum number current can order but can't over order limit
        let maxNumItem = Math.min(
            Math.floor(subtotalLimit / item.price),
            item.quantityLimit);

        while (maxNumItem > 0) {

            const remainThreshold = item.price * maxNumItem;

            const index = products.indexOf(item);

            // get remain products in list
            const nextItemsOrder = getNextItemsOrder(remainThreshold, products.slice(index + 1), underFreeShipTolerance);

            // don't have next items so continue
            if (nextItemsOrder.length === 0) {
                maxNumItem--;
                continue;
            }

            const currQuantity = maxNumItem;

            const mergeItemsOrder = nextItemsOrder.map(x => {
                x.unshift({
                    ...item,
                    quantity: currQuantity
                })
                return x;
            })

            rawOrders = [...rawOrders, ...mergeItemsOrder]

            maxNumItem--;
        }

    }
    // enrich data
    orders = rawOrders.map(order => {
        return {
            total: order.reduce((total, item) => total + item.price * item.quantity, 0),
            totalWeight: order.reduce((total, item) => total + item.weight * item.quantity, 0),
            lineItems: order
        }
    })

    orders = scoreOrders(orders, freeShipMinSp, 0.7);

    orders = orders.sort((a, b) => b.score - a.score)

    return orders
}

const optimzeOrders = generateOptimizeOrders(products)

console.log("Optimize orders length: ", optimzeOrders.length)
// Log to console
console.log(util.inspect(optimzeOrders, { depth: 10, colors: true }));