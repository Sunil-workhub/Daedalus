import APIHelper from "../../context/ApiHelper.js";
import API from "../../constants/API.js";

const ProjectProfitabilityService = {
  GetPendingProjects: async () => {
    // fetch commercial invoice data based on invoice number
    try {
      const response = await APIHelper(
        "GET",
        API.ProjectProfitability.GetPendingProjects,
      );
      return response;
    } catch (error) {
      console.error("Error fetching Pending Projects data:", error);
      throw error;
    }
  },

  // response
  //   {
  //   "status_Code": 200,
  //   "status": "Success",
  //   "message": "Pending projects retrieved successfully.",
  //   "data": [
  //     "PRJ00001"
  //   ]
  // }

  GetProjectDetails: async (searchTerm) => {
    try {
      const response = await APIHelper(
        "POST",
        API.ProjectProfitability.GetProjectDetails,
        {
          projectName: searchTerm,
        },
      );
      return response;
    } catch (error) {
      console.error("Error fetching Project Details data:", error);
      throw error;
    }
  },
  //   response
  //   {
  //   "status_Code": 200,
  //   "status": "Success",
  //   "message": "Project details retrieved successfully.",
  //   "data": [
  //     {
  //       "detail_Id": 1,
  //       "project": "PRJ00001",
  //       "oa_No": "OA1",
  //       "fg_Code": "FG1",
  //       "description": "Hoist",
  //       "qty": 1,
  //       "sales_Value": 26750
  //     },
  //     {
  //       "detail_Id": 2,
  //       "project": "PRJ00001",
  //       "oa_No": "OA1",
  //       "fg_Code": "FG2",
  //       "description": "SGEOT",
  //       "qty": 1,
  //       "sales_Value": 321000
  //     },
  //     {
  //       "detail_Id": 3,
  //       "project": "PRJ00001",
  //       "oa_No": "OA2",
  //       "fg_Code": "FG3",
  //       "description": "SGEOT",
  //       "qty": 1,
  //       "sales_Value": 481500
  //     },
  //     {
  //       "detail_Id": 4,
  //       "project": "PRJ00001",
  //       "oa_No": "OA2",
  //       "fg_Code": "FG4",
  //       "description": "E&C",
  //       "qty": 1,
  //       "sales_Value": 54000
  //     }
  //   ]
  // }

  SaveProjectProfitability: async (
    detail_Id,
    commission,
    freight,
    packing,
    ovc,
    other_Direct,
    fixed_Cost,
    created_By,
  ) => {
    try {
      const response = await APIHelper(
        "POST",
        API.ProjectProfitability.SaveProjectProfitability,
        {
          detail_Id: detail_Id,
          commission: commission,
          freight: freight,
          packing: packing,
          ovc: ovc,
          other_Direct: other_Direct,
          fixed_Cost: fixed_Cost,
          created_By: created_By,
        },
      );
      return response;
    } catch (error) {
      console.error("Error saving Project Profitability data:", error);
      throw error;
    }
  },

  GetPaginatedProjects: async (searchTerm, offset, pageSize) => {
    try {
      const response = await APIHelper(
        "POST",
        API.ProjectProfitability.GetPaginatedProjects,
        {
          searchTerm: searchTerm,
          offset: offset,
          pageSize: pageSize,
        },
      );
      return response;
    } catch (error) {
      console.error("Error fetching Paginated Projects data:", error);
      throw error;
    }
  },

  GetEstimatedProfitability: async (projectName) => {
    try {
      const response = await APIHelper(
        "POST",
        API.ProjectProfitability.GetEstimatedProfitability,
        {
          projectName: projectName,
        },
      );
      return response;
    } catch (error) {
      console.error("Error fetching Estimated Profitability data:", error);
      throw error;
    }
  },

  GetMaterialCosts: async (oa_No, fg_Code) => {
    try {
      const response = await APIHelper(
        "POST",
        API.ProjectProfitability.GetMaterialCosts,
        {
          oa_No: oa_No,
          fg_Code: fg_Code,
        },
      );
      return response;
    } catch (error) {
      console.error("Error fetching Material Costs data:", error);
      throw error;
    }
  },

  UpdateBudgetedCosts: async (payload) => {
    try {
      const response = await APIHelper(
        "POST",
        API.ProjectProfitability.UpdateBudgetedCosts,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error updating Budgeted Costs data:", error);
      throw error;
    }
  },
  //   payload req
  //   {
  //   "items": [
  //     {
  //       "actual_Cost_Id": 0,
  //       "budgeted_Cost": 0
  //     }
  //   ]
  // }
};

export default ProjectProfitabilityService;
