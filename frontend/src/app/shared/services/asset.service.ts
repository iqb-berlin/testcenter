import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BackendService } from '@app/superadmin/backend.service';
import { MessageService } from '@shared/services/message.service';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private assetSlotsSubject = new BehaviorSubject<AssetAssignments>({});
  assetSlots$ = this.assetSlotsSubject.asObservable();
  allAssets: Asset[] = [];
  availableAssetSlots: { slotName: AssetSlotName, slotLabel: string }[] = [
    { slotName: 'logo', slotLabel: 'Logo' },
    { slotName: 'loginIllustration', slotLabel: 'loginIllustration' },
    { slotName: 'loginCompanion', slotLabel: 'loginCompanion' }
  ];

  constructor(private backendService: BackendService, private messageService: MessageService,
              @Inject('FILE_SERVER_URL') private readonly fileServerUrl: string) {
    this.backendService.getAssetAssignments().subscribe((assignments: AssetAssignments) => {
      this.assetSlotsSubject.next(assignments);
    });
    backendService.getAllAssets().subscribe(assets => {
      this.allAssets = assets;
    });
  }

  uploadAsset(fileInput: Event): void {
    const target = fileInput.target as HTMLInputElement;
    const files = target.files as FileList;
    if (files && files[0]) {
      const formData = new FormData();
      formData.append('file', files[0]);

      this.backendService.uploadAsset(formData).subscribe(result => {
        if (result) {
          this.messageService.showSnackbar('Asset hochgeladen');
          this.backendService.getAllAssets().subscribe(assets => {
            this.allAssets = assets;
          });
        }
      });
    }
  }

  deleteAsset(id: number): void {
    this.backendService.deleteAsset(id).subscribe(result => {
      if (result) {
        this.messageService.showSnackbar('Asset gelöscht');
        this.allAssets = this.allAssets.filter(asset => asset.id !== id);
      }
    });
  }

  updateSlot(slotName: AssetSlotName, assetID: number | undefined): void {
    const currentSlots = { ...this.assetSlotsSubject.getValue() };
    if (assetID === undefined) {
      delete currentSlots[slotName as AssetSlotName];
    } else {
      const asset = this.allAssets.find(a => a.id === assetID);
      if (asset) {
        currentSlots[slotName as AssetSlotName] = { assetID, url: asset.url };
      }
    }
    this.assetSlotsSubject.next(currentSlots);
  }

  saveAssetSlots(): void {
    const currentSlots = this.assetSlotsSubject.getValue();
    const assignments = (Object.entries(currentSlots) as [AssetSlotName, AssetAssignment][])
      .map(([slotName, assignment]) => ({
        slotName,
        assetID: assignment.assetID,
        scope: 'global' as const,
        scopeID: 'global' as const
      }));
    this.backendService.setAssetAssignments({ assignments }).subscribe();
  }

  getAssetSrc(slotName: AssetSlotName): string {
    const url = this.assetSlotsSubject.getValue()[slotName]?.url;
    return url ? this.toAbsolute(url) : '';
  }

  toAbsolute(url: string): string {
    return `${this.fileServerUrl}${url.replace(/^\//, '')}`;
  }
}

export interface Asset {
  id: number;
  originalName: string;
  url: string;
}

export interface AssetAssignment {
  assetID: number;
  url: string;
}

export type AssetAssignments = Partial<Record<AssetSlotName, AssetAssignment>>;

export type AssetSlotName = 'logo' | 'loginIllustration' | 'loginCompanion';

export interface AssignmentPostData {
  assignments: {
    slotName: AssetSlotName;
    assetID: number;
    scope: 'global';
    scopeID: 'global';
  }[]
}
