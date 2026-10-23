import { lazy } from "react";

const menuConfig = [
  {
    path: "/iReact/daedalus-item-master",
    component: lazy(
      () => import("../pages/orderIntake/OrderItemMasterPage.jsx"),
    ),
  },
  {
    path: "/iReact/daedalus-customer-master",
    component: lazy(
      () => import("../pages/orderIntake/CustomerMasterPage.jsx"),
    ),
  },
  {
    path: "/iReact/daedalus-order-intake-report",
    component: lazy(
      () => import("../pages/orderIntake/OrderIntakeReportPage.jsx"),
    ),
  },
  {
    path: "/iReact/daedalus-sales",
    component: lazy(() => import("../pages/orderIntake/OrderSalesPage.jsx")),
  },
  {
    path: "/iReact/daedalus-sales-budget",
    component: lazy(
      () => import("../pages/orderIntake/OrderSalesBudgetPage.jsx"),
    ),
  },
];

export default menuConfig;
