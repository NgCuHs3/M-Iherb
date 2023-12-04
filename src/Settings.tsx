import { useState } from "react";
import { useSidePanelContext } from "./contexts/SidePanelContext";

const getColorsState = (numberOfJobs: number) => {
  switch (true) {
    case numberOfJobs <= 40:
      return "text-green-500";
    case numberOfJobs <= 80:
      return "text-warning";
    case numberOfJobs <= 120:
      return "text-orange-600";
    case numberOfJobs > 120:
      return "text-error";
  }
};

const Settings = () => {
  const { sidePanelState, setAutoMatch } = useSidePanelContext();

  const [isProcessing, setIsProcessing] = useState(false);

  const switchAutoMatch = async () => {
    setIsProcessing(true);
    await setAutoMatch(!sidePanelState.autoMatch);
    setIsProcessing(false);
  };

  return (
    <div>
      <div className="form-control">
        <p className="text-left text-xs">
          When activated, it automatically scans and associates orders with
          items to exempt taxes and minimize shipping costs to the fullest
          extent. You won't be able to manually modify the cart as long as this
          option remains enabled!
        </p>
        <label className="label cursor-pointer">
          <span className="label-text">Auto matching orders</span>
          {!isProcessing && (
            <input
              type="checkbox"
              className="toggle"
              checked={sidePanelState.autoMatch}
              onClick={switchAutoMatch}
            />
          )}
          {isProcessing && (
            <div className="flex flex-row gap-1">
              <p>Processing</p>{" "}
              <span className="loading loading-dots loading-sm"></span>
            </div>
          )}
        </label>
        <p className="text-left text-xs">
          The more items in the match list, the greater the number of match
          jobs. Therefore, you should only choose items that can match to reduce
          the number of jobs.
        </p>
        <label className="label cursor-pointer">
          <span className="label-text">
            No. Matching Jobs:{" "}
            <span className={getColorsState(sidePanelState.numberOfJobs)}>
              {" "}
              {sidePanelState.numberOfJobs}
            </span>
          </span>
        </label>
        {/* In later version */}
        {/* <div className="flex flex-row items-center justify-between">
          <span className="label-text">Total weight maximum</span>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text-alt">0.3</span>
              <span className="label-text-alt">0.6</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={50}
              className="range range-xs"
            />
          </label>
        </div>
        <div className="flex flex-row items-center justify-between">
          <span className="label-text">Total weight maximum</span>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text-alt">0.3</span>
              <span className="label-text-alt">0.6</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={50}
              className="range range-xs"
            />
          </label>
        </div>
        <div className="flex flex-row items-center justify-between">
          <span className="label-text">Total weight maximum</span>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text-alt">0.3</span>
              <span className="label-text-alt">0.6</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={50}
              className="range range-xs"
            />
          </label>
        </div> */}
      </div>
    </div>
  );
};

export default Settings;
