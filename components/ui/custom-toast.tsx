import { Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { HStack} from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from 'react-native';
import { HelpCircleIcon, CheckCircle2Icon, AlertCircleIcon, XCircleIcon } from 'lucide-react-native';
import { CloseIcon } from '@/components/ui/icon';
export const showCustomToast = (toast: any, { title, description, variant = 'success' }: { title: string, description: string, variant: 'success' | 'error' | 'warning' | 'info' }) => {
  const newId = Math.random();
  
  const getIconAndColor = () => {
    switch (variant) {
      case 'success':
        return { icon: CheckCircle2Icon, color: 'success-500', bgColor: 'success-50' };
      case 'error':
        return { icon: XCircleIcon, color: 'error-500', bgColor: 'error-50' };
      case 'warning':
        return { icon: AlertCircleIcon, color: 'warning-500', bgColor: 'warning-50' };
      case 'info':
        return { icon: HelpCircleIcon, color: 'info-500', bgColor: 'info-50' };
      default:
        return { icon: CheckCircle2Icon, color: 'success-500', bgColor: 'success-50' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  toast.show({
    id: newId.toString(),
    placement: "top",
    duration: 3000,
    render: ({ id }: { id: string }) => (
      <Toast
        action={variant}
        variant="solid"
        nativeID={`toast-${id}`}
        className={`p-4 gap-6 border-${color} w-full shadow-hard-5 max-w-[443px] flex-row justify-between bg-${bgColor}`}
      >
        <HStack space="lg">
          <Icon as={icon} className={`stroke-${color} mt-0.5`} />
          <VStack space="xs">
            <ToastTitle className={`font-semibold text-${color}`}>
              {title}
            </ToastTitle>
            <ToastDescription size="sm" className={`text-${color}`}>
              {description}
            </ToastDescription>
          </VStack>
        </HStack>
        <Pressable onPress={() => toast.close(id)}>
          <Icon as={CloseIcon} className={`stroke-${color}`} />
        </Pressable>
      </Toast>
    ),
  });
}; 