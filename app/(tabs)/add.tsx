import { Image, StyleSheet, Platform, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  Button,
  ButtonText,
  ButtonSpinner,
  ButtonIcon,
  ButtonGroup,
} from "@/components/ui/button"
import {
  Card,
} from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { Input, InputField } from '@/components/ui/input';
import { BarChart, PieChart } from "react-native-gifted-charts";
import { VStack } from '@/components/ui/vstack';
// import { Heading } from '@/components/ui/heading';  
import { FormControl, 
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
 } from '@/components/ui/form-control';
import { AlertCircleIcon, ChevronDownIcon, PhoneIcon } from '@/components/ui/icon';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { useMutation } from '@tanstack/react-query';
import { collectiondata,fetchLocations, fetchLocalitiesByMunicipality } from '@/api/datacollection';
import { propertiesdata } from '@/api/properties';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import {  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,} from '@/components/ui/select';
  import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Icon } from '@/components/ui/icon';
import { SaveIcon, MapPinIcon, PlusIcon } from 'lucide-react-native';
import { useAuth } from '@/store/authStore';
import { useCounterStore } from '@/store/counterStore';
import { showCustomToast } from '@/components/ui/custom-toast';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineStore } from '@/store/offlineStore';
//import NetInfo from '@react-native-community/netinfo';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { ScrollView as RNScrollView } from 'react-native';

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 2,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};
export interface FormDataType {
  agent_id: string;
  first_name: string;
  last_name: string;
  nationality: string;
  phone_number: string;
  id_type: string;
  id_number: string;
  electoral_area: string;
  locality: string;
  street_name: string;
  valuation_no: string;
  data_type: string;
  data_type_info: string;
  geolocation: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  };
 // propertyDetails?: PropertyDetail[];
}


interface Municipality {
  id: number;
  municipalities: string;
  code: string; 
}

interface Locality {
  id: number;
  name: string;
  code: string; 
}

interface AccuracyStats {
  current: number | null;
  previous: number | null;
  best: number | null;
}

export interface PropertyDetail {
  valuation_no: string;
  valuation_amt: number;
  duration: number;
  property_type: string;
  units: number;
  tax_rate: number;
  tax_amt: number;
  data_typeInfo: string;
}

export default function add() {
  const user = useAuth((state:any) => state.user);
  console.log("User:", user);
  console.log("User type:", typeof user);
  console.log("User properties:", Object.keys(user || {}));
  console.log("Full user object:", JSON.stringify(user, null, 2));

  const [formData, setFormData] = useState({
    agent_id: user?.user_name || '',
    first_name: '',
    last_name: '',
    nationality: 'Ghanaian',
    phone_number: '',
    id_type: '',
    id_number: '',
    electoral_area: '',
    locality: '',
    street_name: '',
    valuation_no: '',
    data_type: '',
    data_type_info: '',
    geolocation: {
      latitude: null as number | null,
      longitude: null as number | null,
      accuracy: null as number | null
    }
  });

  const [propertyDetails, setPropertyDetails] = useState<PropertyDetail[]>([]);
  const [currentProperty, setCurrentProperty] = useState<PropertyDetail>({
    valuation_no: '',
    valuation_amt: 0,
    duration: 0,
    property_type: '',
    units: 0,
    tax_rate: 2.75,
    tax_amt: 0,
    data_typeInfo: ''
  });

  // Add useEffect to update agent_id when user data loads
  useEffect(() => {
    if (user?.user_name) {
      console.log("Setting agent_id to:", user.user_name);
      setFormData(prev => ({
        ...prev,
        agent_id: user.user_name
      }));
    }
  }, [user]);

  console.log("User:", user);
  console.log("Agent ID being sent:", formData.agent_id);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [bestAccuracy, setBestAccuracy] = useState<number | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);
  const [accuracyStats, setAccuracyStats] = useState<AccuracyStats>({
    current: null,
    previous: null,
    best: null
  });
     // Reference for the Select Bottom Sheet
   const selectRef = useRef<any>(null);
   const [isForeigner, setIsForeigner] = useState(false);
  // Add validation function for ID number format
  const validateIdNumber = (number: string, type: string): boolean => {
    switch (type) {
      case 'Ghana Card':
        return /^GHA-\d{9}-\d$/.test(number); // GHA-123456789-0
      case "Driver's License":
        return /^GA-\d{9}-[A-Z]{2}$/.test(number); // GA-123456789-AB
      case 'passport':
        return /^G\d{8}$/.test(number); // G12345678
      default:
        return false;
    }
  };

  // Update your ID type select handler


  const countries = [
    'Nigeria', 'Togo', 'Burkina Faso', 'Ivory Coast', 'Mali', 
    'Benin', 'Niger', 'Senegal', 'Sierra Leone', 'Liberia'
    // Add more countries as needed
  ];
  const handleIdTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_type: value,
      id_number: '' // Clear ID number when type changes
    }));
  };

  // Update your form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Personal Information
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    if (!formData.id_type.trim()) newErrors.id_type = 'ID type is required';
    if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';

    // Location Information
    if (!formData.electoral_area.trim()) newErrors.electoral_area = 'Electoral area is required';
    if (!formData.locality.trim()) newErrors.locality = 'Locality is required';
    if (!formData.street_name.trim()) newErrors.street_name = 'Street name is required';
    if (!formData.valuation_no.trim()) newErrors.valuation_no = 'Valuation number is required';
    if (!formData.geolocation.latitude || !formData.geolocation.longitude) newErrors.geolocation = 'Geolocation is required';

    // Data Information
    if (!formData.data_type.trim()) newErrors.data_type = 'Data type is required';
    if (!formData.data_type_info.trim()) newErrors.data_type_info = 'Data particular is required';

    if (!formData.id_number) {
      newErrors.id_number = 'ID number is required';
    } else if (!validateIdNumber(formData.id_number, formData.id_type)) {
      newErrors.id_number = formData.id_type === 'Ghana Card' ? 'Format: GHA-123456789-0' :
                           formData.id_type === "Driver's License" ? 'Format: GA-123456789-AB' :
                           formData.id_type === 'passport' ? 'Format: G12345678' :
                           'Invalid ID format';
    }
    if(propertyDetails.length === 0){
      newErrors.property_details = 'Property details are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (validateForm()) {
      // First submit the main form data
      const mainFormData = {
        ...formData,
      };
      
      collectionMutation.mutate(mainFormData);

      // If there are property details, submit them separately
      if (propertyDetails.length > 0) {
        // Create an array of promises
        const submissionPromises = propertyDetails.map(property => {
          const propertyData = {
            valuation_no: formData.valuation_no,
            valuation_amt: property.valuation_amt,
            duration: property.duration,
            property_type: formData.data_type_info,
            units: property.units,
            tax_rate: property.tax_rate,
            tax_amt: property.tax_amt,
            data_typeInfo: property.data_typeInfo
          };
          
          // Return a promise for each mutation
          return new Promise((resolve, reject) => {
            PropertyMutation.mutate(propertyData, {
              onSuccess: () => resolve(true),
              onError: (error) => reject(error)
            });
          });
        });
        
        // Wait for all submissions to complete
        Promise.all(submissionPromises)
          .then(() => {
            // Clear property details after all submissions are successful
            setPropertyDetails([]);
            setCurrentProperty({
              valuation_no: '',
              valuation_amt: 0,
              duration: 0,
              property_type: '',
              units: 0,
              tax_rate: 2.75,
              tax_amt: 0,
              data_typeInfo: ''
              
            });
          })
          .catch(error => {
            console.error("Error submitting properties:", error);
          });
      }
    }
  };

 
    // Add queries for municipalities and localities
    const { data: municipalities } = useQuery<Municipality[]>({
      queryKey: ['municipalities'],
      queryFn: fetchLocations
    });

    const [selectedCodes, setSelectedCodes] = useState({
      municipalityCode: '',
      localityCode: ''
    });

    // Update handlers to store codes
const getNextCounter = useCounterStore((state) => state.getNextCounter);
const handleElectoralAreaChange = (value: string) => {
  const municipality = municipalities?.find(m => m.municipalities === value);
  setSelectedCodes(prev => ({
    ...prev,
    municipalityCode: municipality?.code || ''
  }));
  setFormData(prev => ({
    ...prev,
    electoral_area: value,
    locality: '',
   // valuation_no: municipality ? `${municipality.code}-` : ''
  }));
};


const handleLocalityChange = (value: string) => {
  const locality = localities?.find(l => l.name === value);
  if (locality && selectedCodes.municipalityCode) {
    const nextCounter = getNextCounter(selectedCodes.municipalityCode, locality.code);
    const paddedNumber = nextCounter.toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      locality: value,
    //  valuation_no: `${selectedCodes.municipalityCode}-${locality.code}-${paddedNumber}`
    }));
  }
};
  
    // if (isLoading) {
    //   return (
    //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //       <Text>Loading electoral areas...</Text>
    //     </View>
    //   );
    // }


    // if(error){
    //   return 
    //   console.log('message:',error)
    // }
     // Query for localities based on selected municipality
     const { data: localities } = useQuery<Locality[]>({
      queryKey: ['localities', formData.electoral_area],
      queryFn: () => fetchLocalitiesByMunicipality(formData.electoral_area),
      enabled: !!formData.electoral_area
    });


    
  console.log('Municipality:', municipalities);
  console.log('Selected Municipality Code:', selectedCodes.municipalityCode);
  console.log('Localities:', localities);
  console.log('Valuation Number:', formData.valuation_no);
 
  const toast = useToast();

  const collectionMutation = useMutation({
    mutationFn: (data: FormDataType) => collectiondata(data),
    onSuccess: (data) => {
      // Show success toast
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="success" variant="solid">
              <VStack space="xs">
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Data has been successfully saved
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
      
      // Reset form
      setFormData({
        agent_id: user?.user_name || '',
        first_name: '',
        last_name: '',
        nationality: 'Ghanaian',
        phone_number: '',
        id_type: '',
        id_number: '',
        electoral_area: '',
        locality: '',
        street_name: '',
        valuation_no: '',
        data_type: '',
        data_type_info: '',
        geolocation: {
          latitude: null,
          longitude: null,
          accuracy: null
        }
      });
    },
    onError: (error) => {
      // Show error toast
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="error" variant="solid">
              <VStack space="xs">
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>
                  {error.message || 'Failed to save data. Please try again.'}
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    },
  });

  const propertiesdataMutation = useMutation({
    mutationFn: (data: PropertyDetail) => propertiesdata(data),
    onSuccess: (data) => {
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="success" variant="solid">
              <VStack space="xs">
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Property details saved successfully
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    },
    onError: (error) => {
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="error" variant="solid">
              <VStack space="xs">
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>
                  {error.message || 'Failed to save property details. Please try again.'}
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    },
  });

  // Property table

  const PropertyMutation = useMutation({
    mutationFn: (data: PropertyDetail) => propertiesdata(data),
    onSuccess: (data) => {
      // Show success toast
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="success" variant="solid">
              <VStack space="xs">
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Data has been successfully saved
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    },
    onError: (error) => {
      // Show error toast
      toast.show({
        placement: "top",
        render: ({ id }: { id: string }) => {
          return (
            <Toast nativeID={id} action="error" variant="solid">
              <VStack space="xs">
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>
                  {error.message || 'Failed to save property data. Please try again.'}
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    }
  });

  console.log(localities)
console.log(propertiesdataMutation)
console.log(PropertyMutation)
    // Handler for electoral area change
    // const handleElectoralAreaChange = (value: string) => {
    //   setFormData(prev => ({
    //     ...prev,
    //     electoral_area: value,
    //     locality: '' // Reset locality when electoral area changes
    //   }));
    // };
  
console.log(municipalities);

  const getLocation = async () => {
    try {
      setIsLocating(true);
      setLocationError(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError('Location permission denied');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const currentAccuracy = location.coords.accuracy ?? 0;
          
          setAccuracyStats(prev => {
            let newBest = prev.best;
            
            // Update best accuracy if:
            // 1. No best accuracy yet, or
            // 2. Current accuracy is better than best and is <= 4m
            if (!prev.best || (currentAccuracy < prev.best && currentAccuracy <= 4)) {
              newBest = currentAccuracy;
              // Update form data with best location
              setFormData(prevForm => ({
                ...prevForm,
                geolocation: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  accuracy: currentAccuracy
                }
              }));
            }

            return {
              current: currentAccuracy,
              previous: prev.current,
              best: newBest
            };
          });
        }
      );

      setLocationSubscription(subscription);

    } catch (error) {
      setLocationError('Unable to get location');
      console.error(error);
      setIsLocating(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      setIsLocating(false);
    }
  };

  const withinRange = formData.geolocation.accuracy !== null && formData.geolocation.accuracy <= 4;


   // Add duration options
 const durationOptions = [
  { label: '1 Month', value: '1' },
  { label: '3 Months', value: '3' },
  { label: '6 Months', value: '6' },
  { label: '1 Year', value: '12' },
  { label: '1 Year 6 Months', value: '18' },
  { label: '2 Years', value: '24' },
  { label: '3 Years', value: '36' },
];
   // Add duration options
 const propertyTypeOptions = [
  { label: '2 Bedroom', value: '2 bedroom' },
  { label: 'Chamber and Hall', value: 'chamber and hall' },
  { label: 'Flat', value: 'flat' },
  { label: 'Single Room', value: 'single room' },
  { label: '3 Bedroom', value: '3 bedroom' },
  { label: '4 Bedroom', value: '4 bedroom' },

];

    //No_of_units
    const propertyUnitsOptions = [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '10', value: '10' },
       
    ];

  // Add this helper function
  const formatIdNumber = (text: string, idType: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '');

    switch (idType) {
      case 'Ghana Card':
        if (cleaned.length <= 12) {
          // Format as GHA-XXXXXXXXX-X
          let formatted = cleaned;
          if (cleaned.length > 0) formatted = 'GHA-' + formatted;
          if (cleaned.length > 9) {
            formatted = formatted.slice(0, 13) + '-' + formatted.slice(13);
          }
          return formatted;
        }
        break;

      case "Driver's License":
        if (cleaned.length <= 11) {
          // Format as GA-XXXXXXXXX-XX
          let formatted = cleaned;
          if (cleaned.length > 0) formatted = 'GA-' + formatted;
          if (cleaned.length > 9) {
            formatted = formatted.slice(0, 12) + '-' + formatted.slice(12);
          }
          return formatted;
        }
        break;

      case 'passport':
        if (cleaned.length <= 9) {
          // Format as GXXXXXXXX
          let formatted = cleaned;
          if (cleaned.length > 0) formatted = 'G' + formatted;
          return formatted;
        }
        break;
    }

    return cleaned;
  };


  const [showPropertyModal, setShowPropertyModal] = useState(false);

  const calculateTaxAmount = (valuation_amt: number, duration: number, units: number, tax_rate: number): number => {
    const amount = valuation_amt || 0;
    const months = duration || 0;
    const numUnits = units || 0;
    const rate = tax_rate || 2.75;
    return Number(((amount * months * numUnits) * (rate / 100)).toFixed(2));
  };
  const handlePropertyDetailChange = (field: keyof PropertyDetail, value: string) => {
    setCurrentProperty(prev => {
      const updated = { ...prev };
      
      // Convert string values to numbers for numeric fields
      if (field === 'valuation_amt' || field === 'duration' || field === 'units' || field === 'tax_rate') {
        // Only convert to number when the field loses focus or when calculating tax
        // For now, just store the string value to avoid typing delays
        updated[field] = value === '' ? 0 : Number(value);
      } else if (field === 'valuation_no' || field === 'property_type' || field === 'data_typeInfo') {
        updated[field] = value;
      }

      // Calculate tax amount when relevant fields change
      if (field === 'valuation_amt' || field === 'duration' || field === 'units' || field === 'tax_rate') {
        updated.tax_amt = calculateTaxAmount(
          field === 'valuation_amt' ? (value === '' ? 0 : Number(value)) : prev.valuation_amt,
          field === 'duration' ? (value === '' ? 0 : Number(value)) : prev.duration,
          field === 'units' ? (value === '' ? 0 : Number(value)) : prev.units,
          field === 'tax_rate' ? (value === '' ? 0 : Number(value)) : prev.tax_rate
        );
      }

      return updated;
    });
  };

  const handleAddPropertyDetail = () => {
    if (!currentProperty.valuation_amt || !currentProperty.duration || !currentProperty.units) {
        toast.show({
          placement: "top", 
        render: ({ id }) => (
          <Toast nativeID={id} action="error" variant="solid">
                <VStack space="xs">
              <ToastTitle>Error</ToastTitle>
                  <ToastDescription>
                Please fill in all required fields
                  </ToastDescription>
                </VStack>
              </Toast>
        ),
      });
      return;
    }

    // Add the property to the list with the current valuation_no
    const propertyToAdd = {
          ...currentProperty,
          valuation_no: formData.valuation_no //  valuation_no is set from the main form
        };
    setPropertyDetails(prev => [...prev, propertyToAdd]);

    // Reset the form but keep the valuation_no
    setCurrentProperty({
      valuation_no: formData.valuation_no,
      valuation_amt: 0,
      duration: 0,
      property_type: '',
      units: 0,
      tax_rate: 2.75,
      tax_amt: 0,
      data_typeInfo: ''
     
    });
    
    // Show success toast
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={id} action="success" variant="solid">
          <VStack space="xs">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>
              Property added successfully
            </ToastDescription>
          </VStack>
        </Toast>
      ),
    });
  };

  const handleCloseModal = () => {
    setShowPropertyModal(false);

  };

  const canAddPropertyDetails = () => {
    return formData.valuation_no && formData.data_type_info;
  };

  return (
    
    <ScrollView className="flex-1 bg-gray-50 px-4">
     <FormControl>

<View className="">
<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 2
    }}
  >
    DATA COLLECTION
  </Heading>
</Card>

<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700'
    }}
  >
    Personal Information
  </Heading>

  <VStack space="lg">
    <HStack space="md" style={{ alignItems: 'flex-start' }}>
      <VStack style={{ flex: 1}}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
            Surname
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.last_name ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 39
          }}
        >
          <InputField
            value={formData.last_name}
            placeholder='Surname'
            onChangeText={(text: string) => setFormData(prev => ({...prev, last_name: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>      
      </VStack>     
      
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600' }}>
            FirstName
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.first_name ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 39
          }}
        >
          <InputField
            value={formData.first_name}
            placeholder='Firstname'
            onChangeText={(text: string) => setFormData(prev => ({...prev, first_name: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>      
      </VStack> 
    </HStack>    

    <VStack style={{ flex: 1 }}>
      <FormControlLabel>
        <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
          Phone Number
        </FormControlLabelText>
      </FormControlLabel>
      <HStack space="sm">
        <Input
          style={{ 
            width: 60,
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F1F5F9',
            height: 40
          }}
          isDisabled
        >
          <InputField
            value="+233"
            editable={false}
            style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}
          />
        </Input>
        <Input
          style={{ 
            flex: 1,
            borderColor: submitAttempted && errors.phone_number ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
        >
          <InputField
            value={formData.phone_number.replace('+233', '')}
            onChangeText={(text: string) => {
              if (/^\d{0,10}$/.test(text)) {
                setFormData((prev) => ({ ...prev, phone_number: '+233' + text }));
              }
            }}
            placeholder="XXXXXXXXX"
            keyboardType="number-pad"
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
      </HStack>
    </VStack>
    <HStack space="md" style={{ alignItems: 'flex-start' }}>
<VStack style={{ flex: 1 }}>
  <FormControlLabel>
    <HStack style={{ 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 2 
    }}>
      <FormControlLabelText style={{ 
        color: '#334155', 
        fontSize: 16, 
        fontWeight: '600'
      }}>
        Nationality
      </FormControlLabelText>
      <HStack space="md" style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#64748B' }}>
          {isForeigner ? 'Foreigner' : 'Local'}
        </Text>
        <Switch
          value={isForeigner}
          onValueChange={(value: boolean) => {
            setIsForeigner(value);
            setFormData(prev => ({
              ...prev,
              nationality: value ? '' : 'Ghanaian'
            }));
          }}
          trackColor={{ true: '#2563EB', false: '#CBD5E1' }}
        />
      </HStack>
    </HStack>
  </FormControlLabel>

  {isForeigner ? (
    <Select
      selectedValue={formData.nationality}
      onValueChange={(value: string) => setFormData(prev => ({ ...prev, nationality: value }))}
    >
      <SelectTrigger
        style={{ 
          borderColor: submitAttempted && errors.nationality ? '#EF4444' : '#CBD5E1',
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          height: 40
        }}
      >
        <SelectInput 
          placeholder="Select Country"
          style={{ fontSize: 16, color: '#334155', paddingLeft: 12 }}
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          {countries.map((country) => (
            <SelectItem 
              key={country} 
              label={country} 
              value={country}
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  ) : (
    <Input
      style={{ 
        borderColor: '#CBD5E1',
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        height: 40
      }}
      isDisabled
    >
      <InputField 
        value="Ghanaian"
        editable={false}
        style={{ fontSize: 16, color: '#64748B', paddingLeft: 12 }}
      />
    </Input>
  )}
</VStack>
</HStack>
    <HStack space="md" style={{ alignItems: 'flex-start' }}>
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ 
            color: '#334155', 
            fontSize: 14, 
            fontWeight: '600', 
            marginBottom: 4 
          }}>
            ID Type*
          </FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={formData.id_type}
          onValueChange={handleIdTypeChange}
        >
          <SelectTrigger
            style={{ 
              borderColor: submitAttempted && errors.id_type ? '#EF4444' : '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              height: 40,
              marginBottom: errors.id_type ? 4 : 0
            }}
          >
            <SelectInput
              placeholder="Select ID Type"
              value={formData.id_type}
              style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
            />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectItem label="Ghana Card" value="Ghana Card" />
              <SelectItem label="Driver's License" value="Driver's License" />
              <SelectItem label="Passport" value="passport" />
            </SelectContent>
          </SelectPortal>
        </Select>
        {submitAttempted && errors.id_type && (
          <Text style={{ color: '#EF4444', fontSize: 14 }}>{errors.id_type}</Text>
        )}
      </VStack>

      <VStack style={{ flex: 1.2 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ 
            color: '#334155', 
            fontSize: 14, 
            fontWeight: '600', 
            marginBottom: 4 
          }}>
            ID Number*
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.id_number ? '#EF4444' : '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40,
            marginBottom: errors.id_number ? 4 : 0
          }}
        >
          <InputField
            value={formData.id_number}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, id_number: text }))}
            placeholder={
              formData.id_type === 'Ghana Card' ? 'GHA-123456789-0' :
              formData.id_type === "Driver's License" ? 'GA-123456789-AB' :
              formData.id_type === 'passport' ? 'G12345678' : 'Select ID Type first'
            }
            style={{ fontSize: 15, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
        {submitAttempted && errors.id_number && (
          <Text style={{ color: '#EF4444', fontSize: 14 }}>{errors.id_number}</Text>
        )}
      </VStack>
    </HStack>
  </VStack>
</Card>

<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700'
    }}
  >
    Location
  </Heading>

  <VStack space="md">
    <FormControlLabel>
      <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
        Electoral Area*
      </FormControlLabelText>
    </FormControlLabel>
    <Select
      selectedValue={formData.electoral_area}
      onValueChange={handleElectoralAreaChange}
    >
      <SelectTrigger 
        style={{ 
          borderColor: submitAttempted && errors.electoral_area ? '#EF4444' : '#CBD5E1', 
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          height: 40
        }}
      >
        <SelectInput 
          placeholder="Select Electoral Area"
          style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          {municipalities?.map((municipality: any) => (
            <SelectItem 
              key={municipality.id} 
              label={municipality.municipalities} 
              value={municipality.municipalities} 
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>

    <FormControlLabel>
      <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
        Locality*
      </FormControlLabelText>
    </FormControlLabel>
    <Select
      selectedValue={formData.locality}
      onValueChange={handleLocalityChange}
      isDisabled={!formData.electoral_area}
    >
       <SelectTrigger 
        style={{ 
          borderColor: submitAttempted && errors.locality ? '#EF4444' : '#CBD5E1',
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: '#F8FAFC',
          height: 40
        }}
      >
        <SelectInput placeholder="Select Locality"
        style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          {localities?.map((locality) => (
            <SelectItem 
              key={locality.id} 
              label={locality.name} 
              value={locality.name} 
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>

    <VStack space="md">
      <FormControlLabel>
        <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
          Geolocation*
        </FormControlLabelText>
      </FormControlLabel>

      <HStack space="md" style={{ alignItems: 'center' }}>
        <Button
          variant="outline"
          size="lg"
          isDisabled={isLocating}
          style={{
            borderColor: '#CBD5E1',
            borderRadius: 8,
            backgroundColor: isLocating ? '#EEF2FF' : '#F8FAFC'
          }}
          onPress={isLocating ? stopLocationTracking : getLocation}
        >
          <HStack space="sm" style={{ alignItems: 'center' }}>
            <FontAwesome5 
              name="map-marker-alt" 
              size={20} 
              color={isLocating ? "#2563EB" : "#64748B"} 
            />
            <ButtonText style={{ color: isLocating ? '#2563EB' : '#64748B' }}>
              {isLocating ? 'Stop Location' : 'Get Location'}
            </ButtonText>
          </HStack>
        </Button>

      
      </HStack>

      <HStack space="md" style={{ alignItems: 'center' }}>
      <Input
          style={{ 
            flex: 1,
            backgroundColor: '#F1F5F9',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            height: 40
          }}
          isDisabled
        >
          <InputField
            value={formData.geolocation.latitude ? formData.geolocation.latitude.toFixed(6) : ''}
            placeholder="Latitude"
            style={{ color: '#64748B', fontSize: 14, paddingLeft: 12 }}
          />
        </Input>

        <Input
          style={{ 
            flex: 1,
            backgroundColor: '#F1F5F9',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            height: 40
          }}
          isDisabled
        >
          <InputField
            value={formData.geolocation.longitude ? formData.geolocation.longitude.toFixed(6) : ''}
            placeholder="Longitude"
            style={{ color: '#64748B', fontSize: 14, paddingLeft: 12 }}
          />
        </Input>
      </HStack>

      {locationError && (
        <Text style={{ color: '#EF4444', fontSize: 14 }}>{locationError}</Text>
      )}

      {accuracyStats.current !== null && (
        <VStack space="xs" style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ 
            color: accuracyStats.best && accuracyStats.best <= 4 ? '#10B981' : '#64748B',
            fontSize: 14,
            fontWeight: '600'
          }}>
            Best Accuracy: {accuracyStats.best ? `${accuracyStats.best.toFixed(2)}m` : 'Not yet achieved'}
            {accuracyStats.best && accuracyStats.best <= 4 && ' ✓'}
          </Text>
          <Text style={{ 
            color: accuracyStats.current <= 4 ? '#10B981' : '#EF4444',
            fontSize: 14
          }}>
            Current Accuracy: {accuracyStats.current.toFixed(2)}m
          </Text>
          {accuracyStats.previous && (
            <Text style={{ color: '#64748B', fontSize: 14 }}>
              Previous Accuracy: {accuracyStats.previous.toFixed(2)}m
            </Text>
          )}
        </VStack>
      )}
    </VStack>

    <HStack space="md" style={{ marginTop: 5 }}>
      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
            Street Name*
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
          isInvalid={!!(submitAttempted && errors.street_name)}
        >
          <InputField
            value={formData.street_name}
            onChangeText={(text:string) => setFormData(prev => ({...prev, street_name: text}))}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
      </VStack>

      <VStack style={{ flex: 1 }}>
        <FormControlLabel>
          <FormControlLabelText style={{ color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
            Valuation Number*
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{ 
            borderColor: submitAttempted && errors.valuation_no ? '#EF4444' : '#CBD5E1', 
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
          isInvalid={!!(submitAttempted && errors.valuation_no)}
        >
          <InputField
            value={formData.valuation_no}
            onChangeText={(text:string) => {
              setFormData(prev => ({...prev, valuation_no: text}));
            }}
            style={{ fontSize: 14, color: '#334155', paddingLeft: 12 }}
          />
        </Input>
      </VStack>
    </HStack>
  </VStack>
</Card>

<Card 
  size="sm" 
  style={{
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8
  }}
>
  <Heading 
    size="md" 
    style={{ 
      color: '#1E293B',
      marginBottom: 20,
      fontSize: 18,
      fontWeight: '700'
    }}
  >
    Data Information
  </Heading> 
  <HStack space="md" style={{ alignItems: 'flex-start' }}>
    <VStack style={{ flex: 1}}>
      <FormControlLabel>
        <FormControlLabelText 
          style={{ 
            color: '#334155', 
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 2
          }}
        >
          Data Type*
        </FormControlLabelText>
      </FormControlLabel>
      <Select
        selectedValue={formData.data_type}
        onValueChange={(value: string) => {
          setFormData((prev) => ({
            ...prev,
            data_type: value,
            data_type_info: value === 'business' ? 'business' : '',
          }));
        }}
      >
        <SelectTrigger 
          style={{ 
            borderColor: submitAttempted && errors.data_type ? '#EF4444' : '#CBD5E1', 
            borderWidth: 1,
            borderRadius: 8,
            backgroundColor: '#F8FAFC',
            height: 40
          }}
        >
          <SelectInput 
            placeholder="Select data type"
            style={{ 
              fontSize: 16,
              color: '#334155',
              paddingLeft: 12
            }}
          />
          <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectItem label="Property" value="property" />
            <SelectItem label="Business" value="business" />
            </SelectContent>
        </SelectPortal>
      </Select>
    </VStack>

    <VStack style={{ flex: 1 }}>
      <FormControlLabel>
        <FormControlLabelText 
          style={{ 
            color: '#334155', 
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 2
          }}
        >
          Data Particular
        </FormControlLabelText>
      </FormControlLabel>
      {formData.data_type === 'property' ? (
        <VStack>
        <Select
          selectedValue={formData.data_type_info}
            onValueChange={(value: string) => {
              setFormData((prev) => ({ ...prev, data_type_info: value }));
            }}
        >
          <SelectTrigger 
            style={{ 
              borderColor: submitAttempted && errors.data_type_info ? '#EF4444' : '#CBD5E1', 
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              height: 40
            }}
          >
            <SelectInput 
              placeholder="Select property type"
              style={{ 
                fontSize: 16,
                color: '#334155',
                paddingLeft: 12
              }}
            />
            <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectItem label="Residential" value="residential" />
              <SelectItem label="Commercial" value="commercial" />
              <SelectItem label="Mixed Use" value="mixed" />
            </SelectContent>
          </SelectPortal>
        </Select>
          
          {/* Floating Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: -10,
              top: 40,
              backgroundColor: canAddPropertyDetails() ? '#2563EB' : '#94A3B8',
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              zIndex: 1
            }}
            onPress={() => canAddPropertyDetails() && setShowPropertyModal(true)}
            disabled={!canAddPropertyDetails()}
          >
            <PlusIcon size={24} color="white" />
          </TouchableOpacity>
        </VStack>
      ) : (
        <Input 
          isDisabled
          style={{ 
            backgroundColor: '#F1F5F9',
            borderRadius: 8,
            height: 40,
            borderColor: '#CBD5E1',
            borderWidth: 1
          }}
        >
          <InputField 
            value="business"
            style={{ 
              color: '#64748B',
              fontSize: 14,
              paddingLeft: 12
            }}
          />
        </Input>
      )}
    </VStack>
  </HStack>
</Card>

<Modal isOpen={showPropertyModal} onClose={handleCloseModal}>
  <ModalBackdrop />
  <ModalContent>
    <ModalHeader>
      <Heading size="md">Property Details</Heading>
    </ModalHeader>
    <ModalBody>
      <RNScrollView>
        <VStack space="md">        
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Property Type</FormControlLabelText>
            </FormControlLabel>
            <Select
              selectedValue={currentProperty.data_typeInfo}
              onValueChange={(value: string) => handlePropertyDetailChange('data_typeInfo', value)}
            >
              <SelectTrigger 
                style={{ 
                  borderColor: '#CBD5E1',
                  borderWidth: 1,
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                  height: 40
                }}
              >
                <SelectInput 
                  placeholder="Select property type"
                  style={{ 
                    fontSize: 14,
                    color: '#334155',
                    paddingLeft: 12
                  }}
                />
                <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  {propertyTypeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      label={option.label} 
                      value={option.value} 
                      />
                    ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>
          
          <HStack space={10} style={{ alignItems: 'flex-start' }}>
            <FormControl style={{ flex: 1 }}>
              <FormControlLabel>
                <FormControlLabelText>Amount</FormControlLabelText>
              </FormControlLabel>
              <Input style={{ flex: 1 }}>
                <InputField
                  value={currentProperty.valuation_amt.toString()}
                  onChangeText={(value) => handlePropertyDetailChange('valuation_amt', value)}
                  keyboardType="numeric"
                  placeholder="Enter valuation amount"
                  />
              </Input>
            </FormControl>
            
            <FormControl style={{ flex: 1 }}>
              <FormControlLabel>
                <FormControlLabelText>Duration</FormControlLabelText>
              </FormControlLabel>
              <Select
              selectedValue={currentProperty.duration ? currentProperty.duration.toString() : ""}
              onValueChange={(value: string) => handlePropertyDetailChange('duration', value)}
              >
              <SelectTrigger 
              style={{ 
              borderColor: '#CBD5E1',
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              height: 40
              }}
              >
              <SelectInput 
              placeholder="Select duration"
              style={{ 
              fontSize: 14,
              color: '#334155',
              paddingLeft: 12
              }}
              />
              <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
              </SelectTrigger>
              <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
              {durationOptions.map((option) => (
              <SelectItem 
              key={option.value} 
              label={option.label} 
              value={option.value} 
              />
              ))}
              </SelectContent>
              </SelectPortal>
              </Select>
            </FormControl>
          </HStack>
          <HStack space={10} style={{ alignItems: 'flex-start' }}>
          <FormControl style={{ flex: 1 }}>
            <FormControlLabel>
              <FormControlLabelText>Units</FormControlLabelText>
            </FormControlLabel>
            <Select
              selectedValue={currentProperty.units.toString()}
              onValueChange={(value: string) => handlePropertyDetailChange('units', value)}
            >
              <SelectTrigger 
                style={{ 
                  borderColor: '#CBD5E1',
                  borderWidth: 1,
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                  height: 40
                }}
              >
                <SelectInput 
                  placeholder="Select number of units"
                  style={{ 
                    fontSize: 14,
                    color: '#334155',
                    paddingLeft: 12
                  }}
                />
                <ChevronDownIcon style={{ marginRight: 12 }} color="#64748B" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  {propertyUnitsOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      label={option.label} 
                      value={option.value} 
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>

          <FormControl style={{ flex: 1 }}>
            <FormControlLabel>
              <FormControlLabelText>Tax Rate (%)</FormControlLabelText>
            </FormControlLabel>
            <Input style={{ flex: 1 }}>
              <InputField
                value={currentProperty.tax_rate.toString()}
                onChangeText={(value) => handlePropertyDetailChange('tax_rate', value)}
                keyboardType="numeric"
                placeholder="Enter tax rate"
              />
            </Input>
          </FormControl>
          </HStack>
          <Button onPress={handleAddPropertyDetail}>
            <ButtonText>Add Property</ButtonText>
          </Button>

          {propertyDetails.length > 0 && (
            <VStack space="md">
              <Heading size="sm">Added Properties</Heading>
              {propertyDetails.map((property, index) => (
                <Card
                  key={`${property.valuation_no}-${property.duration}-${index}`}
                  size="sm"
                  style={{ marginBottom: 8 }}
                >
                  <VStack space="sm">
                    <Text>Valuation No: {property.valuation_no}</Text>
                    <Text>Amount: ₵{(property.valuation_amt || 0).toLocaleString()}</Text>
                    <Text>Duration: {property.duration} months</Text>
                    <Text>Units: {property.units}</Text>
                    <Text>Tax Rate: {property.tax_rate}%</Text>
                    <Text>Tax Amount: ₵{(property.tax_amt || 0).toLocaleString()}</Text>
                    <Text>Type: {property.data_typeInfo}</Text>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </RNScrollView>
    </ModalBody>
    <ModalFooter>
      <Button onPress={handleCloseModal}>
        <ButtonText>Done</ButtonText>
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

  {/* <Alert action="error" className="gap-3">
  
    <AlertText className="text-typography-900" size="sm">
    <Text className="mr-2 font-semibold text-typography-900">Heads up:</Text>
     Once done, this action cannot be undone
  </AlertText>
</Alert> */}

<VStack space="md" style={{ marginVertical: 16 }}>
  <TouchableOpacity
    style={{
      backgroundColor: withinRange ? '#2563EB' : '#94A3B8',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}
    onPress={handleSubmit}
    disabled={!withinRange || collectionMutation.isPending}
    activeOpacity={0.8}
  >
    <HStack space="sm" style={{ alignItems: 'center' }}>
      {collectionMutation.isPending ? (
        <Spinner size="small" color="white" />
      ) : withinRange ? (
        <Icon as={SaveIcon} size="md" color="white" />
      ) : (
        <Icon as={MapPinIcon} size="md" color="white" />
      )}
      <Text style={{ 
        color: 'white', 
        fontSize: 16, 
        fontWeight: '600' 
      }}>
        {collectionMutation.isPending ? 'Saving...' : 
         withinRange ? 'Save Data' : 'Get Location Within 4m Range'}
      </Text>
    </HStack>
  </TouchableOpacity>
</VStack>


</View>    
   </FormControl>
   </ScrollView> 
      );
}
