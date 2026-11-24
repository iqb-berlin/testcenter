import { Injectable } from '@angular/core';
import {
  combineLatest, distinctUntilChanged, Observable, ReplaySubject, switchMap
} from 'rxjs';
import { map } from 'rxjs/operators';
import { BackendService } from '@app/superadmin/backend.service';
import { MessageService } from '@shared/services/message.service';
import { MainDataService } from '@shared/services/maindata/maindata.service';
import { ThemeService } from './theme.service';
import { FileServerService } from './file-server.service';

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
  // Emits whenever the result of getAssetSrc() may change: on new assignments and on a theme change, since the
  // theme provides fallback images.
  readonly assetSlots$: Observable<AssetAssignments>;
  private assetSlots: AssetAssignments = {};
  allAssets: Asset[] = [];
  availableAssetSlots: { slotName: AssetSlotName, slotLabel: string }[] = ASSET_SLOT_NAMES
    .map(slotName => ({ slotName, slotLabel: slotName }));

  constructor(private backendService: BackendService, private messageService: MessageService,
              mainDataService: MainDataService,
              private themeService: ThemeService,
              private fileServerService: FileServerService) {
    this.assetSlots$ = combineLatest([this.assetSlotsSubject, themeService.activeTheme$])
      .pipe(map(([assetSlots]) => assetSlots));
    // Assignments depend on the login (login before group before global), so they follow its token.
    mainDataService.authData$
      .pipe(
        map(authData => authData?.token),
        distinctUntilChanged(),
        switchMap(() => this.backendService.getAssetAssignments())
      )
      .subscribe(assignments => this.setAssetSlots(assignments));
  }

  private loadAssets(): void {
    this.backendService.getAllAssets().subscribe(assets => {
      this.allAssets = assets;
    });
  }

  getAvailableAssets(): Observable<Asset[]> {
    return this.backendService.getAllAssets().pipe(
      map(assets => {
        this.allAssets = assets;
        return assets.map(asset => ({ ...asset, url: this.toAbsolute(asset.url) }));
      })
    );
  }

  uploadAsset(fileInput: Event): Promise<void> {
    return new Promise((resolve, reject) => {
      const target = fileInput.target as HTMLInputElement;
      const files = target.files as FileList;
      if (files && files[0]) {
        const formData = new FormData();
        formData.append('file', files[0]);

        this.backendService.uploadAsset(formData).subscribe({
          next: result => {
            if (result) {
              this.messageService.showSnackbar('Asset hochgeladen');
              this.loadAssets();
            }
            resolve();
          },
          error: err => reject(err)
        });
      } else {
        resolve();
      }
    });
  }

  deleteAsset(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.backendService.deleteAsset(id).subscribe({
        next: result => {
          this.messageService.showSnackbar('Bild entfernt');
          this.allAssets = this.allAssets.filter(asset => asset.id !== id);
          this.loadAssetSlots();
          resolve();
        },
        error: err => reject(err)
      });
    });
  }

  updateSlot(slotName: AssetSlotName, assetID: number | undefined): void {
    if (assetID === undefined) {
      this.assetSlots[slotName] = { assetID: null, url: null };
    } else {
      const asset = this.allAssets.find(a => a.id === assetID);
      if (asset) {
        this.assetSlots[slotName] = { assetID, url: asset.url };
      } else {
        throw new Error('Asset ID not found');
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
      this.loadAssetSlots();
      this.messageService.showSnackbar('Zuordnungen aktualisiert');
    });
  }

  getAssetSrc(slotName: AssetSlotName): string {
    const assetSlotUrl = this.assetSlots[slotName]?.url;
    if (assetSlotUrl) {
      return this.toAbsolute(assetSlotUrl);
    }
    // Fallback case. Checks the theme for an image and then uses the general fallback assets defined above.
    return (
      this.themeService.getActiveTheme().imagePaths?.[slotName] ||
      DEFAULT_ASSETS[slotName]
    );
  }

  toAbsolute(url: string): string {
    return `${this.fileServerService.getBaseUrl()}${url}`;
  }

  private loadAssetSlots(): void {
    this.backendService.getAssetAssignments()
      .subscribe(assignments => this.setAssetSlots(assignments));
  }

  private setAssetSlots(assignments: AssetAssignments): void {
    this.assetSlots = assignments;
    this.assetSlotsSubject.next(assignments);
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
