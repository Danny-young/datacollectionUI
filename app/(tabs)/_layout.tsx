import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';


import { Colors } from '@/constants/Colors';


export default function TabLayout() {
 

  return (
    <Tabs
      screenOptions={{
       
        headerShown: false,
       
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Ionicons name={ focused ? 'home' : 'home-outline'} size={28}color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'add',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused? 'add-circle' :'add-circle-outline'} size={30} color={color} />,
        }}/>
      <Tabs.Screen
        name="userprofile"
        options={{
          title: 'user',
          tabBarIcon: ({ color, focused }) => <FontAwesome name={focused ? 'user-circle-o' : 'user-circle'} size={28} color={color} />,
        }}/>
      </Tabs>
  );
}
