interface Props {
  productId: number;
  name: string;
  image: string;
  price: number;
  weight: number;
  onRemove: (productId: number) => void;
}

const MatchItem = ({
  productId,
  name,
  image,
  price,
  weight,
  onRemove,
}: Props) => {
  return (
    <div className="card card-compact bg-base-100 shadow">
      <figure>
        <img src={image} alt="product" className="max-h-36" />
      </figure>
      <div className="card-body items-center text-center">
        <h2 className="card-title text-sm">{name}</h2>
        <p className="text-xs font-semibold">
          <span className="text-base">Price:</span> ₫
          <span className="text-base">{price.toLocaleString("en-US")}</span>
        </p>
        <p className="text-xs font-semibold">Weight: {weight} kg</p>
        <div className="card-actions justify-end">
          <button
            className="btn btn-outline btn-error btn-sm"
            onClick={() => onRemove(productId)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchItem;
