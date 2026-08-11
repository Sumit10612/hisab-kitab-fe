import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { switchMap, tap } from "rxjs";

import { ExpenseService } from "./expense.service";
import { NavigationService } from "../../services/navigation.service";
import { NotificationService } from "../../services/notification.service";
import { AppActions } from "../app.action";

import { ExpenseAction } from "./expense.action";

@Injectable()
export class ExpenseEffects {
    private readonly actions$ = inject(Actions);
    private readonly expenseService = inject(ExpenseService);
    private readonly navigation = inject(NavigationService);
    private readonly notification = inject(NotificationService);

    getNext$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(ExpenseAction.getNext),
            switchMap(async ({ groupId, initialGet }) => {
                try {
                    const expenses = await this.expenseService.getNext(
                        groupId,
                        initialGet,
                    );
                    return ExpenseAction.getNextSuccess({ expenses });
                } catch (error) {
                    return AppActions.handleError({ error });
                }
            }),
        );
    });

    getByDateRange$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(ExpenseAction.getByDateRange),
            switchMap(async ({ groupId, startDate, endDate }) => {
                try {
                    const expenses = await this.expenseService.getByDateRange(
                        groupId,
                        startDate,
                        endDate,
                    );
                    return ExpenseAction.getByDateRangeSuccess({
                        expenses,
                        startDate,
                        endDate,
                    });
                } catch (error) {
                    return AppActions.handleError({ error });
                }
            }),
        );
    });

    add$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(ExpenseAction.add),
            switchMap(async ({ groupId, expense }) => {
                this.notification.showLoading();
                try {
                    const id = await this.expenseService.add(groupId, expense);
                    return ExpenseAction.addSuccess({
                        expense: { ...expense, id },
                    });
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    update$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(ExpenseAction.update),
            switchMap(async ({ groupId, id, expense }) => {
                this.notification.showLoading();
                try {
                    await this.expenseService.update(groupId, id, expense);
                    return ExpenseAction.updateSuccess({
                        expense: { ...expense, id },
                    });
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    delete$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(ExpenseAction.remove),
            switchMap(async ({ groupId, id }) => {
                this.notification.showLoading();
                try {
                    await this.expenseService.delete(groupId, id);
                    return ExpenseAction.removeSuccess({ id });
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    addUpdateDeleteSuccess$ = createEffect(
        () => {
            return this.actions$.pipe(
                ofType(
                    ExpenseAction.addSuccess,
                    ExpenseAction.update,
                    ExpenseAction.removeSuccess,
                ),
                tap(() => this.navigation.navigateBack()),
            );
        },
        { dispatch: false },
    );
}
