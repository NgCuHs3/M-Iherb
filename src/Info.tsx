import { useSidePanelContext } from "./contexts/SidePanelContext";

const Info = () => {
  const { sidePanelState } = useSidePanelContext();

  return (
    <div className="overflow-x-auto">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th>Infomation</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {/* row 1 */}
          <tr>
            <td>FREE Shipping min</td>
            <td>
              ₫{sidePanelState.cartInfo.freeShippingMinSpend?.toLocaleString()}
            </td>
          </tr>
          {/* row 2 */}
          <tr>
            <td>VN Subtotal Limit</td>
            <td>₫{sidePanelState.cartInfo.subTotalLimit?.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Info;
