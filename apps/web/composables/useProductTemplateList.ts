/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  AttributeValue,
  Category,
  Product,
  ProductTemplateListResponse,
  QueryProductsArgs,
} from "~/graphql";
import { QueryName } from "~/server/queries";

export const useProductTemplateList = (
  categorySlugIndex?: string,
  fullSearchIndex?: string
) => {
  const { $sdk } = useNuxtApp();

  const loading = useState("loading-product-template-list", () => false);
  const totalItems = useState<number>(`total-items${fullSearchIndex}`, () => 0);
  const productTemplateList = useState<Product[]>(
    `products-category${fullSearchIndex}`,
    () => []
  );
  const attributes = useState<AttributeValue[]>(
    `attributes${categorySlugIndex}`,
    () => []
  );
  const categories = useState<Category[]>(
    `categories-from-product-${categorySlugIndex}`,
    () => []
  );

  const loadProductTemplateList = async (params: QueryProductsArgs) => {
    if (productTemplateList.value.length > 0) return;

    loading.value = true;
    const { data } = await $sdk().odoo.query<
      QueryProductsArgs,
      ProductTemplateListResponse
    >({ queryName: QueryName.GetProductTemplateListQuery }, params);
    loading.value = false;

    productTemplateList.value = data.value?.products?.products || [];
    attributes.value = data.value?.products?.attributeValues || [];
    totalItems.value = data.value?.products?.totalCount || 0;
    categories.value = useUniqBy(
      data.value?.products?.products
        ?.map((product) => product?.categories || [])
        .flat(),
      "id"
    );
  };

  const organizedAttributes = computed(() => {
    if (!productTemplateList.value) return [];

    const data: any = [];

    attributes.value?.forEach((item: any) => {
      const current = data.find(
        (itemData: { attributeName: any }) =>
          itemData.attributeName === item.attribute?.name
      );

      if (!current) {
        data.push({
          id: String(item.attribute.id),
          label: item.attribute?.name,
          attributeName: item.attribute?.name,
          type: item.displayType,
          count: 0,
          options: [],
        });
      }

      data
        .find(
          (itemData: { attributeName: any }) =>
            itemData.attributeName === item.attribute?.name
        )
        .options.push({
          id: String(item.search),
          value: item.id,
          label: item.name,
          metadata: item.search,
          htmlColor: item.htmlColor,
        });
    });

    return data;
  });

  return {
    loading,
    loadProductTemplateList,
    productTemplateList,
    organizedAttributes,
    totalItems,
    categories,
  };
};
