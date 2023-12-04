import MatchItem from "./MatchItem";
import { useSidePanelContext } from "./contexts/SidePanelContext";

const MatchList = () => {
  const { sidePanelState, removeMatchItem, clearMatchItems } =
    useSidePanelContext();

  const onRemoveItem = (productId: number) => removeMatchItem(productId);

  const onClearItems = () => clearMatchItems();

  const macthItems = sidePanelState.matchItemList;

  const viewItems = macthItems.map((item) => (
    <MatchItem
      productId={item.productId}
      name={item.name}
      image={item.image}
      price={item.price}
      weight={item.weight}
      onRemove={onRemoveItem}
    ></MatchItem>
  ));

  return (
    <div className="relative flex flex-col gap-2 items-center">
      {sidePanelState.matchItemList.length > 0 && (
        <div className="relative">
          <p className="text-base">
            {sidePanelState.matchItemList.length} items
          </p>
          <button className="btn btn-wide btn-sm" onClick={onClearItems}>
            Remove All
          </button>
        </div>
      )}
      {sidePanelState.matchItemList.length > 0 && (
        <div className="flex flex-col justify-items-center gap-1">
          {viewItems}
        </div>
      )}
      {sidePanelState.matchItemList.length <= 0 && (
        <p>Let's go to Iherb and add some items to match</p>
      )}
    </div>
  );
};

export default MatchList;
