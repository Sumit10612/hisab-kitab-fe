import { Component, computed, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Store } from "@ngrx/store";

import { GroupAction } from "../../store/group/group.action";
import { GroupSelector } from "../../store/group/group.selector";
import { DividerComponent } from "../shared/divider.component";

@Component({
    selector: "app-investment-settings",
    imports: [
        DividerComponent,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
    template: `
        <div class="container">
            <app-divider text="Asset classes"></app-divider>
            <div class="classes">
                @for (category of $categories(); track category.id) {
                    <span class="chip">
                        {{ category.subCategories[0]?.icon }}
                        {{ category.name }}
                    </span>
                }
            </div>

            <app-divider text="Add asset class"></app-divider>
            <form class="add-form" [formGroup]="form" (ngSubmit)="add()">
                <mat-form-field class="icon-field">
                    <mat-label>Icon</mat-label>
                    <input matInput [formControl]="form.controls.icon" />
                </mat-form-field>
                <mat-form-field class="name-field">
                    <mat-label>Name</mat-label>
                    <input
                        matInput
                        placeholder="e.g. Bonds"
                        [formControl]="form.controls.name"
                    />
                    @if (form.controls.name.hasError("duplicate")) {
                        <mat-error>Already exists</mat-error>
                    }
                </mat-form-field>
                <button
                    mat-flat-button
                    type="submit"
                    [disabled]="form.invalid"
                >
                    Add
                </button>
            </form>
        </div>
    `,
    styles: [
        `
            .classes {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 8px 0 16px;

                .chip {
                    padding: 4px 12px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    font-size: 0.85rem;
                }
            }

            .add-form {
                display: flex;
                gap: 8px;
                align-items: center;

                .icon-field {
                    width: 80px;
                }

                .name-field {
                    flex: 1;
                }
            }
        `,
    ],
})
export class InvestmentSettingsComponent {
    private readonly store = inject(Store);
    private readonly data = inject<{ groupId: string }>(MAT_BOTTOM_SHEET_DATA);

    private readonly $group = this.store.selectSignal(
        GroupSelector.selectGroup(this.data.groupId),
    );

    protected readonly $categories = computed(
        () => this.$group()?.categories ?? [],
    );

    protected readonly form = inject(FormBuilder).group({
        icon: ["💰", Validators.required],
        name: ["", Validators.required],
    });

    protected add(): void {
        const name = (this.form.value.name ?? "").trim();
        const icon = (this.form.value.icon ?? "").trim();
        if (!name || !icon) {
            return;
        }

        if (
            this.$categories().some(
                (c) => c.name.toLowerCase() === name.toLowerCase(),
            )
        ) {
            this.form.controls.name.setErrors({ duplicate: true });
            return;
        }

        this.store.dispatch(
            GroupAction.addCategory({
                groupId: this.data.groupId,
                categoryName: name,
                subCategoryName: name,
                icon,
            }),
        );
        this.form.controls.name.reset("");
    }
}
