import React from "react";
import MatchItem from "./MatchItem";

const MatchList = () => {
  return (
    <div className="relative flex flex-col gap-2 items-center">
      <button className="btn btn-wide btn-sm">Remove All</button>
      <div className="flex flex-col justify-items-center gap-1">
        <MatchItem></MatchItem>
        <MatchItem></MatchItem>
        <MatchItem></MatchItem>
        <MatchItem></MatchItem>
      </div>
    </div>
  );
};

export default MatchList;
