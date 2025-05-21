'use client';

// Import our custom high-priority alert dialog components 
import {
  HighPriorityAlertDialog,
  HighPriorityAlertDialogAction,
  HighPriorityAlertDialogCancel,
  HighPriorityAlertDialogContent,
  HighPriorityAlertDialogDescription,
  HighPriorityAlertDialogFooter,
  HighPriorityAlertDialogHeader,
  HighPriorityAlertDialogTitle,
} from "./components/HighPriorityAlertDialog";

interface DialogsProps {
  showWorkingHoursWarning: boolean;
  setShowWorkingHoursWarning: (show: boolean) => void;
  setIsWorkingHoursValid: (valid: boolean) => void;
  handleSubmit: () => Promise<void>;
  showConflictConfirmation?: boolean;
  setShowConflictConfirmation?: (show: boolean) => void;
  handleForceSubmitWithConflict?: () => Promise<void>;
  conflictMessage?: string;
}

export default function Dialogs({
  showWorkingHoursWarning,
  setShowWorkingHoursWarning,
  setIsWorkingHoursValid,
  handleSubmit,
  showConflictConfirmation = false,
  setShowConflictConfirmation = () => {},
  handleForceSubmitWithConflict = async () => {},
  conflictMessage = ''
}: DialogsProps) {
  return (
    <>
      {/* Çalışma Saatleri Uyarısı */}
      <HighPriorityAlertDialog open={showWorkingHoursWarning} onOpenChange={setShowWorkingHoursWarning}>
        <HighPriorityAlertDialogContent>
          <HighPriorityAlertDialogHeader>
            <HighPriorityAlertDialogTitle>Çalışma Saatleri Dışında</HighPriorityAlertDialogTitle>
            <HighPriorityAlertDialogDescription>
              Seçtiğiniz tarih veya saat, personelin çalışma saatleri dışında veya izin gününe denk gelmektedir.
              Bu randevuyu yine de oluşturmak istediğinizden emin misiniz?
            </HighPriorityAlertDialogDescription>
          </HighPriorityAlertDialogHeader>
          <HighPriorityAlertDialogFooter>
            <HighPriorityAlertDialogCancel onClick={() => {
              setShowWorkingHoursWarning(false);
              setIsWorkingHoursValid(false);
            }}>
              İptal
            </HighPriorityAlertDialogCancel>
            <HighPriorityAlertDialogAction onClick={() => {
              setShowWorkingHoursWarning(false);
              setIsWorkingHoursValid(true);
              handleSubmit();
            }}>
              Evet, Randevu Oluştur
            </HighPriorityAlertDialogAction>
          </HighPriorityAlertDialogFooter>
        </HighPriorityAlertDialogContent>
      </HighPriorityAlertDialog>

      {/* Çakışma Onay Dialogu */}
      <HighPriorityAlertDialog open={showConflictConfirmation} onOpenChange={setShowConflictConfirmation}>
        <HighPriorityAlertDialogContent>
          <HighPriorityAlertDialogHeader>
            <HighPriorityAlertDialogTitle>Çakışma Uyarısı</HighPriorityAlertDialogTitle>
            <HighPriorityAlertDialogDescription className="my-2 text-slate-700">
              {conflictMessage}
            </HighPriorityAlertDialogDescription>
          </HighPriorityAlertDialogHeader>
          <HighPriorityAlertDialogFooter>
            <HighPriorityAlertDialogCancel onClick={() => {
              setShowConflictConfirmation(false);
            }}>
              İptal
            </HighPriorityAlertDialogCancel>
            <HighPriorityAlertDialogAction onClick={() => {
              setShowConflictConfirmation(false);
              handleForceSubmitWithConflict();
            }}>
              Evet, Onayla
            </HighPriorityAlertDialogAction>
          </HighPriorityAlertDialogFooter>
        </HighPriorityAlertDialogContent>
      </HighPriorityAlertDialog>
    </>
  );
}