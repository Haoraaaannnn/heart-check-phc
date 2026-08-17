type ActualCubicle = {
  cubicleNum: string;
  category: string;
  subcategory: string | null;
};

export type CubicleSelectorType = {
  id: number;
  cubicle_name: string;
  cubicle_order: number;
  cubicles?: {
    cubicle: ActualCubicle | null;
  }[];
};