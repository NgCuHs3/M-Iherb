import { GoodOrder } from "../service-worker";

interface Props extends Omit<GoodOrder, "tax" | "proceedToCheckout"> {
  onGo: (shareOrderUrl: string) => void;
  onRemove: (goodOrderId: string) => void;
}

const OrderItem = ({
  id,
  total,
  miningOrderItems,
  shareOrderUrl,
  shipping,
  weight,
  onGo,
  onRemove,
}: Props) => {
  const rowItems = miningOrderItems.map((item) => (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16">
            <img src={item.image} alt="Avatar Tailwind CSS Component" />
          </div>
        </div>
      </td>
      <td>
        <span className="font-normal">{item.name}</span>
      </td>
      <td>
        <span className="text-primary">{item.quantity}</span>{" "}
      </td>
    </tr>
  ));

  return (
    <div className="card card-compact bg-base-100 shadow">
      <div className="card-body">
        <div className="card-title">
          <div className="overflow-x-auto">
            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>{rowItems}</tbody>
            </table>
          </div>
        </div>
        <p className="w-fit font-semibold">Total: {total.toLocaleString()}₫</p>
        <div className="flex flex-row justify-between ">
          <div>
            <p className={"text-sm w-fit "}>
              Shipping:{" "}
              <span className={shipping > 0 ? "text-warning" : "text-success"}>
                {shipping.toLocaleString()}₫
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm w-fit">Weight: {weight}kg</p>
          </div>
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary"
            onClick={() => onGo(shareOrderUrl)}
          >
            Go to cart
          </button>
          <button
            className="btn btn-error btn-outline"
            onClick={() => onRemove(id)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
