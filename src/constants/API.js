const API = {
  DaedalusOrderIntake: {
    GetDaedalusItems: "/ILeap/GetDaedalusItems",
    GetDaedalusItemsOptions: "/ILeap/GetDaedalusItemOptions",
    SaveDaedalusItem: "/ILeap/SaveDaedalusItem",
    SetDaedalusItemActive: "/ILeap/SetDaedalusItemActive",

    GetDaedalusCustomers: "/ILeap/GetDaedalusCustomers",
    SaveDaedalusCustomer: "/ILeap/SaveDaedalusCustomer",
    GetDaedalusCustomerAddresses: "/ILeap/GetDaedalusCustomerAddresses",
    SaveDaedalusCustomerAddress: "/ILeap/SaveDaedalusCustomerAddress",
    SetDaedalusCustomerActive: "/ILeap/SetDaedalusCustomerActive",
    SetDaedalusCustomerAddressActive: "/ILeap/SetDaedalusCustomerAddressActive",
    GetDaedalusAddressTypes: "/ILeap/GetDaedalusAddressTypes",

    GetDaedalusOrders: "/ILeap/GetDaedalusOrders",
    GetDaedalusInvoices: "/ILeap/GetDaedalusInvoices",
    CreateDaedalusOrder: "/ILeap/CreateDaedalusOrder",
    CreateDaedalusInvoice: "/ILeap/CreateDaedalusInvoice",
    CancelDaedalusOrderQty: "/ILeap/CancelDaedalusOrderQty",

    GetDaedalusBudgetItemCombinations:
      "/ILeap/GetDaedalusBudgetItemCombinations",
    GetDaedalusBudgetCombinations: "/ILeap/GetDaedalusBudgetCombinations",
    GetDaedalusBudgetGrid: "/ILeap/GetDaedalusBudgetGrid",
    AddDaedalusBudgetCombination: "/ILeap/AddDaedalusBudgetCombination",
    SetDaedalusBudgetCombinationActive:
      "/ILeap/SetDaedalusBudgetCombinationActive",
    SaveDaedalusBudgetGrid: "/ILeap/SaveDaedalusBudgetGrid",

    GetCustomerAddresses: "/ILeap/GetCustomerAddresses",
  },

  // common
  FileDownload: {
    DownloadFile: "/ILeap/DownloadFile",
  },
};

export default API;
