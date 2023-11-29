import React, { useState } from "react";

const Settings = () => {
  const [autoMatch, setAutoMatch] = useState(true);

  return (
    <div>
      <p className="text-left text-xs">
        When activated, it automatically scans and associates orders with items
        to exempt taxes and minimize shipping costs to the fullest extent. You
        won't be able to manually modify the cart as long as this option remains
        enabled!
      </p>
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Automatic match order</span>
          <input
            type="checkbox"
            className="toggle"
            checked={autoMatch}
            onClick={() => setAutoMatch(!autoMatch)}
          />
        </label>
      </div>
    </div>
  );
};

export default Settings;
