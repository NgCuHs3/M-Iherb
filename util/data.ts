export function parseSubTotalLimit(errorOverLimitMsg: string): number {
  // Use a regular expression to match numbers with commas
  const match = errorOverLimitMsg.match(/₫([\d,]+)/);
  if (match) {
    // Extracted number with commas
    const numberWithCommas = match[1];
    // Remove commas from the number
    const numberWithoutCommas = numberWithCommas.replace(/,/g, "");
    // Parse the number as a JavaScript number
    const parsedNumber = parseFloat(numberWithoutCommas);
    return parsedNumber;
  } else
    throw new Error(
      "Don't found SubTotal Limit from error msg: " + errorOverLimitMsg
    );
}

export function generateIherbItemImage(
  partNumber: string,
  primaryImageIndex: number
) {
  // Assuming the base URL is "https://s3.images-iherb.com/"
  const baseUrl = "https://s3.images-iherb.com/";

  partNumber = partNumber
    .toLowerCase()
    ?.match(/[a-zA-Z0-9]/g)
    ?.join("") as string;

  // Extracting the brand code from the part number
  const brandCode = partNumber
    .match(/[a-z]+/i)
    ?.at(0)
    ?.toLowerCase();

  // Constructing the image URL
  const imageUrl = `${baseUrl}${brandCode}/${partNumber}/m/${primaryImageIndex}.jpg`;

  return imageUrl;
}

export function convertPrice(priceString: string) {
  // Remove non-numeric characters (except for the dot for decimals)
  const numericString = priceString.replace(/[^\d.]/g, "");

  // Convert the numeric string to a floating-point number
  const priceFloat = parseFloat(numericString);

  return priceFloat;
}

export interface HashItem {
  count: number;
  code: number | string;
}

export async function generateHashForOrder(
  hashItems: HashItem[]
): Promise<string> {
  const hashString: string = hashItems.reduce((currentStr, item) => {
    return currentStr + `_${item.code}x${item.code}`;
  }, "");

  const encoder = new TextEncoder();
  const data = encoder.encode(hashString);

  try {
    // Use the SubtleCrypto API to calculate the SHA-256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert the hash buffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedValue = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return hashedValue;
  } catch (error) {
    console.error("Error calculating hash:", error);
    throw error;
  }
}
