import generateOptimizeOrders from "../core/GenerateOptimizeOrders";

test("generates with 1 item 318,000x3 = 954,000, 954,000 > 948,000 - 100,000 so quantity must be: 3", () => {
  const res = generateOptimizeOrders(
    [
      {
        productId: 91619,
        price: 318000,
        weight: 0.23,
        quantityLimit: 3,
      },
    ],
    {
      subtotalLimit: 1063674,
      freeShipMinSp: 948000,
      underFreeShipTolerance: 100000,
    }
  );
  expect(res[0].lineItems[0].quantity).toBe(3);
});

test("generates with 1 item 358,893x2 = 717,786 < 948,000 - 100,000 and 358,893x3 > 106,3674 so no order return", () => {
  const res = generateOptimizeOrders(
    [
      {
        productId: 91619,
        price: 358893,
        weight: 0.23,
        quantityLimit: 3,
      },
    ],
    {
      subtotalLimit: 1063674,
      freeShipMinSp: 948000,
      underFreeShipTolerance: 100000,
    }
  );
  expect(res).toHaveLength(0);
});
