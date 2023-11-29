import React from "react";

const MatchItem = () => {
  return (
    <div className="card card-compact bg-base-100 shadow">
      <figure>
        <img
          src="https://s3.images-iherb.com/now/now01661/m/36.jpg"
          alt="product"
          className="max-h-36"
        />
      </figure>
      <div className="card-body items-center text-center">
        <h2 className="card-title text-sm">
          NOW Foods, Ultra Omega-3 Fish Oil, 90 Softgels
        </h2>
        <p className="text-xs font-semibold">Price: ₫352,870</p>
        <p className="text-xs font-semibold">Weight: 0.17 kg</p>
        <div className="card-actions justify-end">
          <button className="btn btn-outline btn-error btn-sm">Remove</button>
        </div>
      </div>
    </div>
  );
};

export default MatchItem;
