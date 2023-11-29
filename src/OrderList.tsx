import React from "react";
import OrderItem from "./OrderItem";

const OrderList = () => {
  return (
    <div className="relative flex flex-col gap-2 items-center">
      <div className="flex flex-col justify-items-center gap-1">
        <OrderItem></OrderItem>
        <OrderItem></OrderItem>
        <OrderItem></OrderItem>
      </div>
    </div>
  );
};

export default OrderList;
