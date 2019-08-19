import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from './loader/loader.component';
import { UiTableComponent } from './tables/ui-table/ui-table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { UpdatePriceComponent } from './dialogues/update-price/update-price.component';
import { AddDocumentComponent } from './dialogues/add-document/add-document.component';
import { VideoDialogueComponent } from './dialogues/video-dialogue/video-dialogue.component';
import { CookieBarComponent } from './dialogues/cookie-bar/cookie-bar.component';
import { PriceLogsComponent } from './dialogues/price-logs/price-logs.component';
import { ScrollbarModule } from 'ngx-scrollbar';
import { CargoDetailsComponent } from './dialogues/cargo-details/cargo-details.component';
import { DndDirective } from '../directives/dnd.directive';
import { DragDropComponent } from './drag-drop/drag-drop.component';
import { FileDropModule } from 'angular2-file-drop';
import { VesselScheduleDialogComponent } from './dialogues/vessel-schedule-dialog/vessel-schedule-dialog.component';
import { AddContainersComponent } from './dialogues/add-containers/add-containers.component';
import { AddBlComponent } from './dialogues/add-bl/add-bl.component';
import { AddCustomerComponent } from './dialogues/add-customer/add-customer.component'
import { SafeUrlPipe } from '../constants/pipe/safeurlfilter';

@NgModule({
  imports: [CommonModule, NgbModule, FormsModule, NgxPaginationModule, FileDropModule, ScrollbarModule],
  declarations: [
    LoaderComponent,
    UiTableComponent,
    UpdatePriceComponent,
    AddDocumentComponent,
    VideoDialogueComponent,
    CookieBarComponent,
    PriceLogsComponent,
    CargoDetailsComponent,
    DndDirective,
    DragDropComponent,
    VesselScheduleDialogComponent,
    AddContainersComponent,
    AddBlComponent,
    AddCustomerComponent,
    SafeUrlPipe
  ],
  exports: [
    LoaderComponent,
    UiTableComponent,
    UpdatePriceComponent,
    AddDocumentComponent,
    CookieBarComponent,
    DndDirective,
    DragDropComponent
  ],
  entryComponents: [
    VideoDialogueComponent,
    UpdatePriceComponent,
    PriceLogsComponent,
    CargoDetailsComponent,
    VesselScheduleDialogComponent,
    AddBlComponent,
    AddContainersComponent,
    AddCustomerComponent
  ]
})
export class SharedModule { }
