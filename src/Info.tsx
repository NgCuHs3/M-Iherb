import React from "react";

const Info = () => {
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
            <td>₫948,000</td>
          </tr>
          {/* row 2 */}
          <tr>
            <td>VN Subtotal Limit</td>
            <td>₫1,063,673</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Info;
