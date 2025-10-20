import { createSelector, MemoizedSelector } from "@ngrx/store";

import { State } from "..";
import { Group, GroupInfo } from "../../models/group.model";

import { groupAdapter, groupCodeAdapter } from "./group.reducer";

export const groupAdapterSelectors = groupAdapter.getSelectors<State>(
    (state) => state.group.groups,
);
export const groupCodeAdapterSelectors = groupCodeAdapter.getSelectors<State>(
    (state) => state.group.groupCodes,
);

export namespace GroupSelector {
    export const selectAll = createSelector(
        groupAdapterSelectors.selectAll,
        (entities) => entities,
    );

    export const selectGroup: (
        id: string,
    ) => MemoizedSelector<State, GroupInfo | undefined> = (id) =>
        createSelector(
            groupAdapterSelectors.selectEntities,
            (entities) => entities[id],
        );

    export const selectCode: (
        id: string,
    ) => MemoizedSelector<State, number | undefined> = (id) =>
        createSelector(
            groupCodeAdapterSelectors.selectEntities,
            (entities) => entities[id]?.code,
        );

    export const selectExpandedCategoryId = createSelector(
        (state: State) => state.group.expandedCateoryId,
        (categoryId) => categoryId,
    );

    export const selectExpandedSubCategoryId = createSelector(
        (state: State) => state.group.expandedSubCateoryId,
        (subCategoryId) => subCategoryId,
    );

    export const selectExpenseFilterCriteria = createSelector(
        (state: State) => state.group.expenseFilterCriteria,
        (criteria) => criteria,
    );
}
