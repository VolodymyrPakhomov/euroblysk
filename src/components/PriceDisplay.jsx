import PropTypes from "prop-types";
import { formatMoney, toUah } from "../utils/price.js";

export function PriceDisplay({ priceInfo, priceOld, usdRate, className }) {
  if (!priceInfo) return null;
  const converted = toUah(priceInfo.amount, priceInfo.currency, usdRate);
  const oldConverted = priceOld ? toUah(priceOld, priceInfo.currency, usdRate) : null;
  return (
    <div className={className}>
      {formatMoney(converted.amount, converted.currency)}
      {oldConverted && (
        <span className="price-old">{formatMoney(oldConverted.amount, oldConverted.currency)}</span>
      )}
    </div>
  );
}

PriceDisplay.propTypes = {
  priceInfo: PropTypes.shape({
    amount:   PropTypes.number.isRequired,
    currency: PropTypes.oneOf(["UAH", "USD"]).isRequired,
  }),
  priceOld:  PropTypes.number,
  usdRate:   PropTypes.number,
  className: PropTypes.string.isRequired,
};
