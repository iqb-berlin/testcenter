import { Inject, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BackendService } from '@app/superadmin/backend.service';
import { MessageService } from '@shared/services/message.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { ThemeService } from './theme.service';

const DEFAULT_ASSETS: Record<AssetSlotName, string> = {
  logo: 'assets/images/IQB-Logo-2025.png',
  loginIllustration: 'assets/images/login-illustration.png',
  codeInputIllustration: 'assets/images/code-input-illustration-kids.png',
  codeInputCompanion: 'assets/images/bird-character.png',
  starterCompanion: 'assets/images/bird-character-cool.png',
  starterCardDone: 'assets/images/bird-character-done.png',
  loadingProgress: 'assets/images/bird-character-cool.png',
  confirmDialog: 'assets/images/bird-character-cool.png'
};

const ASSET_SLOT_NAMES = [
  'logo',
  'loginIllustration',
  'codeInputIllustration',
  'codeInputCompanion',
  'starterCompanion',
  'starterCardDone',
  'loadingProgress',
  'confirmDialog'
] as const;

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private assetSlotsSubject = new ReplaySubject<AssetAssignments>(1);
  assetSlots$ = this.assetSlotsSubject.asObservable();
  private assetSlots: AssetAssignments = {};
  allAssets: Asset[] = [];
  availableAssetSlots: { slotName: AssetSlotName, slotLabel: string }[] = ASSET_SLOT_NAMES
    .map(slotName => ({ slotName, slotLabel: slotName }));

  constructor(private backendService: BackendService, private messageService: MessageService,
              private mainDataService: MainDataService,
              private themeService: ThemeService,
              @Inject('FILE_SERVER_URL') private readonly fileServerUrl: string) { }

  private loadAssets(): void {
    this.backendService.getAllAssets().subscribe(assets => {
      this.allAssets = assets;
    });
  }

  getAvailableAssets(): Observable<Asset[]> {
    return this.backendService.getAllAssets().pipe(
      map(assets => assets.map(asset => ({ ...asset, url: this.toAbsolute(asset.url) })))
    );
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
        this.messageService.showSnackbar('Bild entfernt');
        this.allAssets = this.allAssets.filter(asset => asset.id !== id);
        this.refreshAssetSlots();
      }
    });
  }

  updateSlot(slotName: AssetSlotName, assetID: number | undefined): void {
    if (assetID === undefined) {
      this.assetSlots[slotName] = { assetID: null, url: null };
    } else {
      const asset = this.allAssets.find(a => a.id === assetID);
      if (asset) {
        this.assetSlots[slotName] = { assetID, url: asset.url };
      }
    }
    this.assetSlotsSubject.next(this.assetSlots);
  }

  saveAssetSlots(): void {
    const assignments = ASSET_SLOT_NAMES
      .map(slotName => ({
        slotName,
        assetID: this.assetSlots[slotName]?.assetID ?? null,
        scope: 'global' as const,
        scopeID: 'global' as const
      }));
    this.backendService.setAssetAssignments({ assignments }).subscribe(() => {
      this.refreshAssetSlots();
    });
  }

  getAssetSrc(slotName: AssetSlotName): string {
    const assetSlotUrl = this.assetSlots[slotName]?.url;
    if (assetSlotUrl) {
      return this.toAbsolute(assetSlotUrl);
    }
    // Fallback case. Checks the theme for an image and then uses the general fallback assets defined above.
    return (
      this.themeService.activeTheme.imagePaths?.[slotName] ||
      DEFAULT_ASSETS[slotName]
    );
  }

  toAbsolute(url: string): string {
    return `${this.fileServerUrl}${url}`;
  }

  refreshAssetSlots(): void {
    this.backendService.getAssetAssignments().subscribe((assignments: AssetAssignments) => {
      this.assetSlots = assignments;
      this.assetSlotsSubject.next(assignments);
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

export type AssetSlotName = typeof ASSET_SLOT_NAMES[number];

export interface AssignmentPostData {
  assignments: {
    slotName: AssetSlotName;
    assetID: number | null;
    scope: 'global';
    scopeID: 'global';
  }[]
}
