import Button from "../Elements/Button/button";

const CardProduct = (props) => {
  const { children, isAddButton = false } = props;
  
  if (isAddButton) {
      return (
          <div 
              className="w-full max-w-xs bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl shadow-inner flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-200 transition duration-300 sm:w-[48%] md:w-[31%] lg:w-[23%] h-[350px]"
              onClick={props.onClick}
          >
              {children}
          </div>
      );
  }

  return (
    <div className="w-full max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col justify-between transform transition duration-300 hover:scale-[1.02] sm:w-[48%] md:w-[31%] lg:w-[23%]">
      {children}
    </div>
  );
};

const Header = ({ images }) => {
  return (
    <a href="#">
      <img
        src={images}
        alt="product"
        className="p-4 rounded-t-xl object-cover w-full h-48"
        onError={(e) => {
            e.target.onerror = null; 
            e.target.src="https://placehold.co/400x300/e0e7ff/3730a3?text=No+Image";
        }}
      />
    </a>
  );
};

const Body = ({ children, title }) => {
  return (
    <div className="px-5 pb-5 flex flex-col justify-between flex-grow">
      <a href="#">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 mb-2">{title}</h5>
      </a>
      <p className="text-sm text-gray-700 h-16 overflow-hidden">{children}</p>
    </div>
  );
};

const Footer = ({ price, handleAddToCart, handleDeleteProduct, id }) => {
  const formatPrice = (p) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(p);

  return (
    <div className="px-5 pb-5 pt-3">
      <span className="block text-lg font-bold text-gray-900 mb-2">
        {formatPrice(price)}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <Button
          className="bg-blue-600 text-sm py-2"
          onClick={() => handleAddToCart(id)}
        >
          +
        </Button>
        <Button
          className="bg-red-500 text-sm py-2 text-center"
          onClick={() => handleDeleteProduct(id)}
        >
          Hapus
        </Button>
    </div>

    </div>
  );
};



CardProduct.Header = Header
CardProduct.Body = Body
CardProduct.Footer = Footer

export default CardProduct;