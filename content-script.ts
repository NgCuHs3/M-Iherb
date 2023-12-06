import "./styles/content-script.css";
import debounce from "./util/debounce";
import IherbCheckoutApi, { ResponseIherbApi } from "./core/IherbCheckoutApi";
import { API_TEMPORARY_BAN } from "./core/error";

var notification: HTMLElement;

const onAddMatchButtonClick = async (productId: string) => {
  const { state } = await chrome.runtime.sendMessage({
    type: "add-product",
    data: {
      productId: productId,
    },
  });

  if (state === "ADDED") {
    showNotification("Added item " + productId, "success");
    return;
  }

  if (state === "ERROR")
    showNotification(
      "Please add product later because API is blocked !",
      "warning"
    );
  if (state === "EXISTED") {
    showNotification(`Item ${productId} already added`, "success");
  }
};

function addNotification() {
  // Get the body element
  const body = document.body;
  // Create a new div element
  notification = document.createElement("div");

  notification.innerHTML = "<div><strong>Hello World<strong></div>";

  notification.id = "notification";
  // Add a class to the div for styling
  notification.classList.add(
    ..."sole-notification notification-hide".split(" ")
  );
  // Append the div to the body
  body.appendChild(notification);
}

function hideNotification() {
  if (!notification) return;
  notification.classList.remove("notification-show");
  notification.classList.add("notification-hide");
}

const debounceHideNotification = debounce(hideNotification, 200);

var showNotificationTimeid: NodeJS.Timeout | null;

function showNotification(
  text: string,
  status: "success" | "warning" | "error",
  time = 2500
) {
  if (!notification) return;

  const strongTag = notification.querySelector("strong") as HTMLElement;
  strongTag.textContent = text;

  notification.classList.remove(
    "notification-hide",
    "notification-success",
    "notification-error"
  );

  notification.classList.add(
    status === "success"
      ? "notification-success"
      : status === "warning"
      ? "notification-warning"
      : "notification-error"
  );

  notification.classList.add("notification-show");

  // clear previous hide notification intend
  if (showNotificationTimeid) clearTimeout(showNotificationTimeid);

  showNotificationTimeid = setTimeout(debounceHideNotification, time);
}

function addMatchButton() {
  // button already exist
  if (!!document.getElementById("add-to-match-btn")) return;

  const generalAddBtn = document.getElementById(
    "btn-add-to-cart"
  ) as HTMLElement;

  // not in product page
  if (!generalAddBtn) return;

  const btn = generalAddBtn.querySelector("div button") as HTMLButtonElement;

  const productId = btn.getAttribute("data-product-id");

  const matchBtn = document.createElement("button");

  matchBtn.id = "add-to-match-btn";

  matchBtn.setAttribute("product-id", productId as string);

  matchBtn.innerHTML = "<strong>Add to match</strong>";

  matchBtn.classList.add(
    ..."btn btn-primary btn-block btn-lg btn-add-to-cart".split(" ")
  );

  matchBtn.classList.add(..."match-btn".split(" "));

  matchBtn.addEventListener("click", () =>
    onAddMatchButtonClick(productId as string)
  );

  btn.parentNode?.insertBefore(matchBtn, btn);
}

const debounceAddMatchButton = debounce(addMatchButton, 100);

// it will bind to product container listen to product change
// Function to handle mutations in the document
function handleDocumentMutations() {
  // we should debounce it
  debounceAddMatchButton();
}

// Select the target node (the entire document)
const targetNode = document.querySelector(".container-fluid") as Node;

// Create a MutationObserver instance
const observer = new MutationObserver(handleDocumentMutations);

// Configure the observer to watch for changes in attributes and the addition/removal of child nodes
const config = { childList: true, attributes: true, subtree: true };

// Start observing the target node (document) for mutations
observer.observe(targetNode, config);

// call the first time when pages is loaded
addNotification();
addMatchButton();

// Function to get cookies for the current website
async function getCookies() {
  const iherbApi = new IherbCheckoutApi();
  const res = await iherbApi.addLineItems([
    {
      productId: 106239,
      quantity: 2,
    },
    {
      productId: 78386,
      quantity: 2,
    },
  ]);

  await iherbApi.clearLineItems();

  const cartInfo = await iherbApi.cartInfo();

  console.log(cartInfo);

  const items = await iherbApi.mapItems([
    {
      productId: 9743,
    },
    {
      productId: 78386,
    },
    {
      productId: 102333,
    },
    {
      productId: 88365,
    },
  ]);

  console.log(items);
}

// Call the function when the content script is injected
// getCookies();

async function makeRequest(
  url: string,
  init: RequestInit
): Promise<Omit<ResponseIherbApi, "json"> & { data: any }> {
  console.log("MAKE REQUEST");

  let response: any;
  try {
    response = await fetch(url, init);

    console.log("RESQUEST RES", response);

    if (response.ok)
      return {
        ok: true,
        status: response.status,
        data: await response.json(),
      };
  } catch (error) {
    console.log("error", error);
    console.log("error", (error as any).status);
    console.log("error", JSON.stringify(error));
  }

  return {
    ok: false,
    status: response?.status || API_TEMPORARY_BAN,
    data: null,
  };
}

// message listener
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    case "api-request":
      const { url, init } = request.data;
      makeRequest(url, init).then((res) => {
        sendResponse({
          ...res,
        });
      });
      return true;
    case "on-found-good-order":
      showNotification(
        `Congratulations found good order, Total: ${(
          request.data.total as number
        ).toLocaleString()}₫`,
        "success"
      );
      return;
    default:
      break;
  }
});

// notify to service have iherb page load
chrome.runtime.sendMessage({
  type: "on-page-load",
});
