import { CommonModule } from "@angular/common";
import {
	Component,
	ElementRef,
	inject,
	Input,
	OnDestroy,
	OnInit,
	ViewChild
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";

import { getCategoryById } from "../../models/category.model";
import { Expense } from "../../models/expense.model";
import { getGroupImage, Group, GroupMember } from "../../models/group.model";
import { ExpenseService } from "../../services/expense.service";
import { GroupService } from "../../services/group.service";
import { getYearMonth } from "../../utilities/date";
import { LayoutComponent } from "../shared/layout.component";
import { PageNavHeaderComponent } from "../shared/page-nav-header.component";
import { GroupWidgetComponent } from "../widgets/group-widget.component";

@Component({
	selector: "app-group-expesnse-detail",
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonToggleModule,
		MatIconModule,
		MatButtonModule,
		PageNavHeaderComponent,
		GroupWidgetComponent,
		LayoutComponent,
		RouterLink,
		MatDividerModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./group-expesnse-deatil.component.html",
	styleUrls: ["./group-expesnse-deatil.component.scss"]
})
export class GroupExpenseDetailComponent implements OnInit, OnDestroy {
	@ViewChild("scrollContainer", { static: false }) scrollContainer: ElementRef | undefined;
	
	private readonly groupService = inject(GroupService);
	private readonly expenseService = inject(ExpenseService);

	private expenses: Expense[] = [];
	private subscription?: Subscription;

	protected groupedExpenses?: Record<string, Expense[]>;
	protected group: Group | undefined;
	protected getGroupImage = getGroupImage;
	protected selectedTab: string = "expense";
	protected getCategory = getCategoryById;
	protected loading = false;

	@Input() id: string = "";

	ngOnInit() {
		this.getNextExpenses(true);
	}

	ngOnDestroy(): void {
		this.subscription?.unsubscribe();
	}

	protected get getCurrentMonthTotal() {
		const currentMonth = getYearMonth(new Date());
		return this.group?.monthTotal[currentMonth] ?? 0;
	}

	protected noSort() {
		return 0;
	}

	protected onScroll() {
		if (this.loading || !this.scrollContainer?.nativeElement.scrollTop) {
			return;
		}

		const element = this.scrollContainer.nativeElement;
		if (element.scrollHeight - element.clientHeight <= element.scrollTop + 1) {
			this.getNextExpenses();
		}
	}

	private getNextExpenses(initialGet = false) {
		this.loading = true;
		this.subscription = this.groupService.get$(this.id).subscribe(async group => {
			this.group = group;
			const expenseDocs = await this.expenseService.getAll(this.id, initialGet);
			this.expenses = this.expenses.concat(expenseDocs);

			const members = group.members.reduce((acc, member) => {
				acc[member.id] = member;
				return acc;
			}, {} as Record<string, GroupMember>);

			this.groupedExpenses = this.expenses.reduce((acc, e) => {
				const key = getYearMonth(e.expenseDate);
				acc[key] = acc[key] || [];
				acc[key].push({ ...e, paidBy: members[e.paidBy].name } as Expense);
				return acc;
			}, {} as Record<string, Expense[]>);

			this.loading = false;
		});
	}
}
