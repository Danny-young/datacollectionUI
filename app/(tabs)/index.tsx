import React, { useEffect, useState } from 'react'
import { Text, View, ScrollView, Dimensions } from 'react-native'
import { BarChart, PieChart } from "react-native-gifted-charts";
import { listAgents } from "@/api/agents"
import { MetricCard } from "@/components/ui/MetricCard"
import {  } from "@/components/ui/icon"
import { Card } from "@/components/ui/card"
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { DollarSignIcon, TargetIcon, TrendingUpIcon, UsersIcon } from 'lucide-react-native';
import { Heading } from '@/components/ui/heading';
import { useAuth } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';


export default function HomeScreen() {
  
  const user = useAuth((state:any) => state.user);
  const [timeFilter, setTimeFilter] = useState('week');
  const screenWidth = Dimensions.get('window').width;

  // useEffect(() => {
  //   listAgents();
  // }
  // , []);

   const barData = [
    {value: 250, label: 'M'},
    {value: 500, label: 'T', frontColor: '#177AD5'},
    {value: 745, label: 'W', frontColor: '#177AD5'},
    {value: 320, label: 'T'},
    {value: 600, label: 'F', frontColor: '#177AD5'},
    {value: 256, label: 'S'},
    {value: 300, label: 'S'},
];

const pieData = [
  {value: 54, color: '#177AD5', text: '54%'},
  {value: 30, color: '#79D2DE', text: '30%'},
  {value: 26, color: '#ED6665', text: '26%'},
  ];

  const timeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (!user) return 'Agent';
    if (typeof user.user_name === 'object') {
      return user.user_name.user_name || 'Agent';
    }
    return user.user_name || user.name || 'Agent';
  };

  const collectionStats = {
    total: 2500,
    target: 5000,
    percentComplete: (2500 / 5000) * 100,
    activeAgents: 12,
    growth: 12.5
  };

  const topCollections = [
    { id: 1, name: 'John Doe', amount: 1200, date: '2024-02-25', status: 'completed' },
    { id: 2, name: 'Jane Smith', amount: 950, date: '2024-02-24', status: 'completed' },
    // ... more data
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <LinearGradient
        colors={['#2563EB', '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 20,
          paddingTop: 40,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <VStack space="sm">
          <Text style={{ 
            color: '#E0E7FF',
            fontSize: 16,
            fontWeight: '500' 
          }}>
            {timeOfDay()}
          </Text>
          <Heading
            size="xl"
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: '700',
              marginBottom: 4
            }}
          >
            Welcome back, {getUserName()}! 👋
          </Heading>
  
          <Text style={{ 
            color: '#E0E7FF',
            fontSize: 14,
            marginTop: 8
          }}>
            Here's what's happening with your collections
          </Text>
        </VStack>
      </LinearGradient>

      <VStack style={{ padding: 16 }}>
        {/* Header */}
        <HStack 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}
        >
          <Heading 
            size="xl" 
            style={{ 
              color: '#1E293B',
              fontSize: 24,
              fontWeight: '700'
            }}
          >
            Dashboard
          </Heading>
          <HStack space="sm">
            {['week', 'month', 'year'].map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={timeFilter === filter ? 'solid' : 'outline'}
                style={{
                  backgroundColor: timeFilter === filter ? '#2563EB' : 'transparent',
                  borderColor: '#CBD5E1',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6
                }}
                onPress={() => setTimeFilter(filter)}
              >
                <ButtonText 
                  style={{ 
                    color: timeFilter === filter ? 'white' : '#64748B',
                    fontSize: 14,
                    fontWeight: '600'
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </ButtonText>
              </Button>
            ))}
          </HStack>
        </HStack>

        {/* Collection Progress Card */}
        <Card 
          style={{
            padding: 16,
            marginBottom: 16,
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <HStack style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <VStack>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>
                Collection Target
              </Text>
              <Heading size="lg" style={{ color: '#1E293B' }}>
                ₵{collectionStats.target.toLocaleString()}
              </Heading>
            </VStack>
            <TargetIcon size={24} color="#2563EB" />
          </HStack>

          <VStack style={{ marginTop: 8 }}>
            <HStack style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#64748B' }}>Progress</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B' }}>
                {collectionStats.percentComplete.toFixed(1)}%
              </Text>
            </HStack>
            <Progress 
              value={collectionStats.percentComplete} 
              style={{
                height: 8,
                backgroundColor: '#E2E8F0',
                borderRadius: 4,
              }}
              filledTrackStyle={{
                backgroundColor: '#2563EB',
                borderRadius: 4,
              }}
            />
          </VStack>
        </Card>

        {/* Metric Cards */}
        <VStack style={{ flexWrap: 'wrap', gap: 12 }}>
          <MetricCard
            title="Total Collections"
            value={collectionStats.total}
            change={collectionStats.growth}
            icon={<DollarSignIcon size={24} color="#2563EB" />}
          />
          {/* <MetricCard
            title="Monthly Growth"
            value={collectionStats.growth}
            suffix="%"
            icon={<TrendingUpIcon size={24} color="#2563EB" />}
          />
          <MetricCard
            title="Active Agents"
            value={collectionStats.activeAgents}
            change={2}
            icon={<UsersIcon size={24} color="#2563EB" />}
          /> */}
        </VStack>

        <Card style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <VStack space="md">
            <Heading size="md" style={{ color: '#1E293B', marginBottom: 8 }}>
              Recent Collections
            </Heading>
            
            {topCollections.map((collection) => (
              <HStack 
                key={collection.id}
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E2E8F0'
                }}
              >
                <HStack space="sm" style={{ alignItems: 'center' }}>
                  <Avatar 
                    size="sm"
                    source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(collection.name)}` }}
                    alt={collection.name}
                  />
                  <VStack>
                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#1E293B' }}>
                      {collection.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748B' }}>
                      {new Date(collection.date).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack space="sm" style={{ alignItems: 'center' }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: '#1E293B' 
                  }}>
                    {collection.amount.toLocaleString()}
                  </Text>
                  <View style={{
                    backgroundColor: collection.status === 'completed' ? '#DCF7E3' : '#FEF3C7',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: collection.status === 'completed' ? '#059669' : '#D97706',
                      textTransform: 'capitalize'
                    }}>
                      {collection.status}
                    </Text>
                  </View>
                </HStack>
              </HStack>
            ))}

            <Button
              size="sm"
              variant="outline"
              style={{
                marginTop: 8,
                borderColor: '#CBD5E1',
                borderRadius: 8
              }}
              onPress={() => {/* Navigate to full list */}}
            >
              <ButtonText style={{ color: '#64748B' }}>
                View All Collections
              </ButtonText>
            </Button>
          </VStack>
        </Card>

        {/* Charts */}
        <HStack style={{ flexWrap: 'wrap', marginTop: 16 }}>
          <Card 
            style={{
              width: '100%',
              marginBottom: 16,
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
              <Heading 
                size="md"
                style={{ 
                  color: '#1E293B',
                  fontSize: 18,
                  fontWeight: '600'
                }}
              >
                Daily Collections
              </Heading>
            </Card>
            <Card style={{ padding: 16 }}>
              <BarChart
                barWidth={22}
                noOfSections={3}
                barBorderRadius={4}
                frontColor="#2563EB"
                data={barData}
                yAxisThickness={0}
                xAxisThickness={0}
                height={200}
                width={screenWidth - 64}
              />
            </Card>
          </Card>

          <Card 
            style={{
              width: '100%',
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
              <Heading 
                size="md"
                style={{ 
                  color: '#1E293B',
                  fontSize: 18,
                  fontWeight: '600'
                }}
              >
                Collection Status
              </Heading>
            </Card>
            <Card style={{ padding: 16, alignItems: 'center' }}>
              <PieChart
                donut
                showText
                textColor="black"
                innerRadius={70}
                showTextBackground
                textBackgroundColor="white"
                textBackgroundRadius={22}
                data={pieData}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B' }}>
                      78%
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748B' }}>
                      Success Rate
                    </Text>
                  </View>
                )}
              />
              <HStack 
                style={{ 
                  justifyContent: 'space-around', 
                  width: '100%', 
                  marginTop: 16 
                }}
              >
                {pieData.map((item, index) => (
                  <HStack key={index} style={{ alignItems: 'center' }}>
                    <View 
                      style={{ 
                        backgroundColor: item.color,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        marginRight: 8
                      }}
                    />
                    <Text style={{ color: '#1E293B', fontSize: 14 }}>
                      {item.text}
                    </Text>
                  </HStack>
                ))}
              </HStack>
            </Card>
          </Card>
        </HStack>
      </VStack>
    </ScrollView>
  );
}