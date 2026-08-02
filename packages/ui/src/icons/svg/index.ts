import { type Component, mergeProps } from "solid-js";
import type { IconProps } from "@/icons/svg/types.ts";
import {
  ArrowLeft,
  ArrowUp,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleMinus,
  CircleQuestionMark,
  Clipboard,
  Copy,
  CreditCard,
  Database,
  Download,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Gauge,
  Globe,
  GripVertical,
  Heart,
  Info,
  Key,
  KeyRound,
  Languages,
  List,
  ListFilter,
  Lock,
  LogOut,
  Moon,
  Palette,
  Pencil,
  PictureInPicture2,
  Plus,
  QrCode,
  RefreshCw,
  Repeat,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SquareCheck,
  Sun,
  SunMedium,
  Terminal,
  Trash2,
  Upload,
  User,
  Vault,
  WandSparkles,
  X,
} from "lucide-solid";

function wrapLucide(
  LucideComp: Component<Record<string, unknown>>,
): Component<IconProps> {
  return (props: IconProps) => {
    const merged = mergeProps({ size: 16, strokeWidth: 2 }, props);
    return LucideComp(merged);
  };
}

export const RefreshIcon = wrapLucide(RefreshCw);
export const LockIcon = wrapLucide(Lock);
export { default as AppIcon } from "@/icons/svg/AppIcon.tsx";
export { default as GithubIcon } from "@/icons/svg/GithubIcon.tsx";
export const VaultIcon = wrapLucide(Vault);
export const ChevronDownIcon = wrapLucide(ChevronDown);
export const ChevronLeftIcon = wrapLucide(ChevronLeft);
export const ArrowLeftIcon = wrapLucide(ArrowLeft);
export const CopyIcon = wrapLucide(Copy);
export const EyeIcon = wrapLucide(Eye);
export const EyeOffIcon = wrapLucide(EyeOff);
export const ExternalLinkIcon = wrapLucide(ExternalLink);
export const SearchIcon = wrapLucide(Search);
export const PlusIcon = wrapLucide(Plus);
export const SyncIcon = wrapLucide(RefreshCw);
export const ThemeIcon = wrapLucide(SunMedium);
export const PaletteIcon = wrapLucide(Palette);
export const KeyIcon = wrapLucide(Key);
export const UploadIcon = wrapLucide(Upload);
export const TrashIcon = wrapLucide(Trash2);
export const LogoutIcon = wrapLucide(LogOut);
export const ShieldIcon = wrapLucide(ShieldCheck);
export const InfoIcon = wrapLucide(Info);
export const QuestionIcon = wrapLucide(CircleQuestionMark);
export const QrIcon = wrapLucide(QrCode);
export const GeneratorIcon = wrapLucide(KeyRound);
export const SettingsIcon = wrapLucide(Settings);
export const DragIcon = wrapLucide(GripVertical);
export const EditIcon = wrapLucide(Pencil);
export const HeartFilledIcon = wrapLucide(Heart);
export const HeartOutlineIcon = wrapLucide(Heart);
export const NoteIcon = wrapLucide(FileText);
export const ChevronRightIcon = wrapLucide(ChevronRight);
export const DownloadIcon = wrapLucide(Download);
export const GlobeIcon = wrapLucide(Globe);
export const MoreVerticalIcon = wrapLucide(EllipsisVertical);
export const CloseIcon = wrapLucide(X);
export const ClipboardIcon = wrapLucide(Clipboard);
export const FilterIcon = wrapLucide(ListFilter);
export const CardIcon = wrapLucide(CreditCard);
export const IdentityIcon = wrapLucide(User);
export const ListIcon = wrapLucide(List);
export const PopoutIcon = wrapLucide(PictureInPicture2);
export const MinusCircleIcon = wrapLucide(CircleMinus);
export const SunIcon = wrapLucide(Sun);
export const MoonIcon = wrapLucide(Moon);
export const EnIcon = wrapLucide(Languages);
export const ViIcon = wrapLucide(Languages);
export const CapsLockIcon = wrapLucide(ArrowUp);
export const ListCheckIcon = wrapLucide(SquareCheck);
export const AutofillIcon = wrapLucide(WandSparkles);
export const FolderIcon = wrapLucide(Folder);
export const ReportsIcon = wrapLucide(ChartColumn);
export const ShieldAlertIcon = wrapLucide(ShieldAlert);
export const RepeatKeyIcon = wrapLucide(Repeat);
export const GaugeIcon = wrapLucide(Gauge);
export const GlobeUnlockIcon = wrapLucide(Globe);
export const Shield2FAIcon = wrapLucide(ShieldCheck);
export const DatabaseBreachIcon = wrapLucide(Database);
export const SshKeyIcon = wrapLucide(Terminal);

export * from "@/icons/svg/types.ts";
