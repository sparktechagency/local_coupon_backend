const validateCoupon = ({
  discount_percentage,
  promo_title,
  regular_amount,
  discount_amount,
  mxn_amount,
}: {
  discount_percentage?: number;
  promo_title?: string;
  regular_amount?: number;
  discount_amount?: number;
  mxn_amount?: number;
}): string | null => {
  const hasDiscountPercentage = discount_percentage !== undefined;
  const hasPromoTitle = promo_title !== undefined && promo_title !== "";
  const hasRegularAmount = regular_amount !== undefined;
  const hasDiscountAmount = discount_amount !== undefined;
  const hasMxnAmount = mxn_amount !== undefined;

  const hasPriceValues = hasRegularAmount && hasDiscountAmount && hasMxnAmount;
  const hasPartialPriceValues =
    (hasRegularAmount || hasDiscountAmount || hasMxnAmount) && !hasPriceValues;

  if (!hasDiscountPercentage && !hasPromoTitle && !hasPriceValues) {
    return "At least one valid coupon type must be provided: 'discount_percentage', 'promo_title', or all three of 'regular_amount', 'discount_amount', and 'mxn_amount'.";
  }

  // Type 1: If discount_percentage is selected, other values must be empty
  if (hasDiscountPercentage) {
    if (hasPromoTitle || hasPriceValues || hasPartialPriceValues) {
      return "If 'discount_percentage' is selected, 'promo_title', 'regular_amount', 'discount_amount', and 'mxn_amount' must not be provided.";
    }
  }

  // Type 2: If promo_title is selected, other values must be empty
  if (hasPromoTitle) {
    if (hasDiscountPercentage || hasPriceValues || hasPartialPriceValues) {
      return "If 'promo_title' is selected, 'discount_percentage', 'regular_amount', 'discount_amount', and 'mxn_amount' must not be provided.";
    }
  }

  // Type 3: If any one or two of regular_amount, discount_amount, or mxn_amount are present, it's an invalid state
  if (hasPartialPriceValues) {
    return "If using 'regular_amount', 'discount_amount', and 'mxn_amount', all three values must be provided together.";
  }

  // Type 3: If all three price-related fields are set, then discount_percentage and promo_title should not be set
  if (hasPriceValues) {
    if (hasDiscountPercentage || hasPromoTitle) {
      return "If 'regular_amount', 'discount_amount', and 'mxn_amount' are selected, 'discount_percentage' and 'promo_title' must not be provided.";
    }
  }

  return null; // No validation errors
};

export default validateCoupon;
