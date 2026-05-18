import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { BackendService } from '@app/superadmin/backend.service';
import { MessageService } from '@shared/services/message.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';

const DEFAULT_ASSET_ASSIGNMENTS: AssetAssignments = {
  logo: { assetID: null, url: 'assets/IQB-Logo-2025.png' },
  loginIllustration: { assetID: null, url: 'assets/login-illustration.png' },
  loginCompanion: { assetID: null, url: 'assets/images/bird-character.png' }
};

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private assetSlotsSubject = new BehaviorSubject<AssetAssignments>(DEFAULT_ASSET_ASSIGNMENTS);
  assetSlots$ = this.assetSlotsSubject.asObservable();
  allAssets: Asset[] = [];
  availableAssetSlots: { slotName: AssetSlotName, slotLabel: string }[] = [
    { slotName: 'logo', slotLabel: 'Logo' },
    { slotName: 'loginIllustration', slotLabel: 'loginIllustration' },
    { slotName: 'loginCompanion', slotLabel: 'loginCompanion' }
  ];

  constructor(private backendService: BackendService, private messageService: MessageService,
              private mainDataService: MainDataService,
              @Inject('FILE_SERVER_URL') private readonly fileServerUrl: string) {
    this.mainDataService.authData$
      .pipe(distinctUntilChanged((previous, current) => previous?.token === current?.token))
      .subscribe(() => this.refreshAssetSlots());
  }

  loadAssets(): void {
    this.backendService.getAllAssets().subscribe(assets => {
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
          this.loadAssets();
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
      currentSlots[slotName] = { assetID: null, url: null };
    } else {
      const asset = this.allAssets.find(a => a.id === assetID);
      if (asset) {
        currentSlots[slotName] = { assetID, url: asset.url };
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
    this.backendService.setAssetAssignments({ assignments }).subscribe(() => {
      this.refreshAssetSlots();
    });
  }

  getAssetSrc(slotName: AssetSlotName): string {
    const url = this.assetSlotsSubject.getValue()[slotName]?.url ?? DEFAULT_ASSET_ASSIGNMENTS[slotName]?.url;
    return url ? this.toAbsolute(url) : '';
  }

  toAbsolute(url: string): string {
    // valid examples that don't need further mangling
    // "assets/logo.png" -> local in Angular application
    // "data:image/png;base64,abc123" -> inline data
    // "http://example.com/logo.png" -> URL
    // "https://example.com/logo.png" -> URL
    if (/^(assets\/|data:|https?:\/\/)/.test(url)) {
      return url;
    }
    return `${this.fileServerUrl}${url.replace(/^\//, '')}`;
  }

  private refreshAssetSlots(): void {
    this.backendService.getAssetAssignments().subscribe((assignments: AssetAssignments) => {
      this.assetSlotsSubject.next({ ...DEFAULT_ASSET_ASSIGNMENTS, ...assignments });
    });
  }
}

export interface Asset {
  id: number;
  originalName: string;
  url: string;
}

export interface AssetAssignment {
  assetID: number | null;
  url: string | null;
}

export type AssetAssignments = Partial<Record<AssetSlotName, AssetAssignment>>;

export type AssetSlotName = 'logo' | 'loginIllustration' | 'loginCompanion';

export interface AssignmentPostData {
  assignments: {
    slotName: AssetSlotName;
    assetID: number | null;
    scope: 'global';
    scopeID: 'global';
  }[]
}
