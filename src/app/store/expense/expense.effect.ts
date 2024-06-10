import { Injectable, inject } from "@angular/core";
import { ExpenseService } from "../../services/expense.service";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { ExpenseAction } from "./expense.action";
import { catchError, finalize, of, switchMap, tap } from "rxjs";
import { NotificationService } from "../../services/notification.service";
import { NavigationService } from "../../services/navigation.service";

@Injectable()
export class ExpenseEffects {
	private readonly actions$ = inject(Actions);
	private readonly expenseService = inject(ExpenseService);
	private readonly navigation = inject(NavigationService);
	private readonly notification = inject(NotificationService);

	getNext$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ExpenseAction.getNext),
			switchMap(async ({ groupId, initialGet }) => {
				const expenses = await this.expenseService.getNext(groupId, initialGet);
				return ExpenseAction.getNextSuccess({ expenses });
			})
		)
	);

	add$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ExpenseAction.add),
			tap(() => this.notification.showLoading()),
			switchMap(async ({ groupId, expense }) => {
				await this.expenseService.add(groupId, expense);
				return ExpenseAction.cudSuccess();
			}),
			catchError(() => of(ExpenseAction.addFail())),
			finalize(() => this.notification.hideLoading())
		)
	);

	update$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ExpenseAction.update),
			tap(() => this.notification.showLoading()),
			switchMap(async ({ groupId, id, expense }) => {
				await this.expenseService.update(groupId, id, expense);
				return ExpenseAction.cudSuccess();
			}),
			catchError(() => of(ExpenseAction.updateFail())),
			finalize(() => this.notification.hideLoading())
		)
	);

	delete$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ExpenseAction.remove),
			tap(() => this.notification.showLoading()),
			switchMap(async ({ groupId, id }) => {
				await this.expenseService.delete(groupId, id);
				return ExpenseAction.cudSuccess();
			}),
			catchError(() => of(ExpenseAction.removeFail())),
			finalize(() => this.notification.hideLoading())
		)
	);

	addUpdateSuccess$ = createEffect(() =>
		this.actions$.pipe(
			ofType(ExpenseAction.cudSuccess),
			tap(() => this.navigation.navigateBack())
		),
		{ dispatch: false }
	);
}