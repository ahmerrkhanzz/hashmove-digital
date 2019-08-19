import { Component, OnInit, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { encryptBookingID, feet2String } from '../../../constants/globalFunctions';
import { DashboardService } from '../../../components/pages/user-desk/dashboard/dashboard.service';

@Component({
  selector: 'app-cargo-details',
  templateUrl: './cargo-details.component.html',
  styleUrls: ['./cargo-details.component.scss']
})
export class CargoDetailsComponent implements OnInit {
  @Input() data: any
  public containers:any[] = []
  constructor(public _activeModal: NgbActiveModal, private _dashboardService: DashboardService) {}



  close(){
    this._activeModal.close()
  }

  
  ngOnInit() {
    console.log(this.data)
    this.getContainerDetails()
  }

  getContainerDetails() {
    let id = encryptBookingID(this.data.BookingID, this.data.UserID, this.data.ShippingModeCode);
    this._dashboardService.getContainerDetails(id, 'CUSTOMER').subscribe((res: any) => {
      console.log(res)
      this.containers = res.returnObject
    }, (err) => {
      console.log(err)
    })
  }

  getContainerInfo(container) {
    let containerInfo = {
      containerSize: undefined,
      containerWeight: undefined
    };
    containerInfo.containerWeight = container.MaxGrossWeight;
    containerInfo.containerSize =
      feet2String(container.containerLength) +
      ` x ` +
      feet2String(container.containerWidth) +
      ` x ` +
      feet2String(container.containerHeight);
    return containerInfo;
  }

}

