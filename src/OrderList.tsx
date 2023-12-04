import OrderItem from "./OrderItem";
import { useSidePanelContext } from "./contexts/SidePanelContext";

const OrderList = () => {
  const { sidePanelState, removeGoodOrder } = useSidePanelContext();

  const onGo = (shareOrderUrl: string) => {
    chrome.tabs.create({ url: shareOrderUrl });
  };

  const onRemove = (goodOrderId: string) => removeGoodOrder(goodOrderId);

  return (
    <div className="relative flex flex-col gap-2 items-center">
      <div className="flex flex-col justify-items-center gap-1">
        {sidePanelState.goodOrderList.length > 0 &&
          sidePanelState.goodOrderList.map((order) => {
            return (
              <OrderItem
                id={order.id}
                total={order.total}
                miningOrderItems={order.miningOrderItems}
                shareOrderUrl={order.shareOrderUrl}
                shipping={order.shipping}
                weight={order.weight}
                onGo={onGo}
                onRemove={onRemove}
              ></OrderItem>
            );
          })}
        {sidePanelState.goodOrderList.length <= 0 && (
          <div>
            <p>Oops current don't have any good order !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
