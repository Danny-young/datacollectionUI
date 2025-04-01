import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from "@/components/ui/text"
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { TrendingUpIcon, TrendingDownIcon} from 'lucide-react-native';
interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  suffix?: string;
  icon: React.ReactNode;
  
}

export const MetricCard = ({ title, value, change, icon }: MetricCardProps) => (
  <Card 
    style={{
      flex: 1,
      margin: 8,
      backgroundColor: 'white',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}
  >
    <Card style={{ padding: 16 }}>
      <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ padding: 8, borderRadius: 20, backgroundColor: '#EEF2FF' }}>
          {icon}
        </View>
        <HStack style={{ alignItems: 'center' }}>
          {change !== undefined && (
            <>
              {change >= 0 ? 
                <TrendingUpIcon size={16} color="#10B981" /> : 
                <TrendingDownIcon size={16} color="#EF4444" />
              }
              <Text style={{ 
                marginLeft: 4, 
                color: change >= 0 ? '#10B981' : '#EF4444',
                fontSize: 14 
              }}>
                {Math.abs(change)}%
              </Text>
            </>
          )}
        </HStack>
      </HStack>
      <Text style={{ color: '#64748B', marginTop: 8 }}>{title}</Text>
      <Heading size="lg" style={{ marginTop: 4, color: '#1E293B' }}>{value}</Heading>
    </Card>
  </Card>
);