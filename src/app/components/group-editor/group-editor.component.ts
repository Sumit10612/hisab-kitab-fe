import { Component, Input, Signal, effect, inject } from '@angular/core';

import { PageNavHeaderComponent } from '../shared/page-nav-header.component';
import { GroupService } from '../../services/group.service';
import { Group, getGroupImage } from '../../models/group.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { GroupWidgetComponent } from '../widgets/group-widget.component';
import { LayoutComponent } from '../shared/layout.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-group-editor',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonToggleModule,
    PageNavHeaderComponent,
    GroupWidgetComponent,
    LayoutComponent
  ],
  templateUrl: './group-editor.component.html',
  styleUrl: './group-editor.component.scss'
})
export class GroupEditorComponent {
  private readonly groupService = inject(GroupService);
  private readonly route = inject(ActivatedRoute);

  protected getGroupImage = getGroupImage;
  protected selectedTab: string = "expense";
  protected $group = toSignal<Group>(this.route.paramMap.pipe(
    switchMap(params => {
      const id = params.get('id');
      return this.groupService.currentGroup$(id ?? "");
    })
  ));

  @Input() id: string | undefined;
}
