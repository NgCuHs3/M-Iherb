import React from "react";

const OrderItem = () => {
  return (
    <div className="card card-compact bg-base-100 shadow">
      <figure>
        <div className="carousel">
          <div className="carousel-item ">
            <img
              src="https://s3.images-iherb.com/now/now01662/m/38.jpg"
              alt="Burger"
              className="max-h-28"
            />
          </div>
          <div className="carousel-item">
            <img
              src="https://s3.images-iherb.com/sor/sor54433/m/40.jpg"
              alt="Burger"
              className="max-h-28"
            />
          </div>
          <div className="carousel-item">
            <img
              src="https://s3.images-iherb.com/mli/mli00952/m/218.jpg"
              alt="Burger"
              className="max-h-28"
            />
          </div>
        </div>
      </figure>
      <div className="card-body">
        <h2 className="card-title text-sm">Order includes 2 products</h2>
        <p className="w-fit">Total: ₫945,000</p>
        <div className="flex flex-row justify-between">
          <div>
            <p className="text-xs w-fit">Shipping: ₫0</p>
          </div>
          <div>
            <p className="text-xs w-fit">Tax: ₫0</p>
          </div>
        </div>
        <div className="card-actions justify-end">
          <button className="btn btn-accent">Buy Now</button>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
