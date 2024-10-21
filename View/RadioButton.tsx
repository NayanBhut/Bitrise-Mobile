import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

export default function Radio({value, changeValue, text}) {
  return (
    <TouchableOpacity style={radioStyle.btn} onPress={changeValue}>
      <Text
        style={[
          radioStyle.txt,
          value === true
            ? {backgroundColor: 'blue'}
            : {backgroundColor: 'white'},
        ]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const radioStyle = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    margin: 5,
  },
  txt: {fontSize: 15, color: 'red', padding: 10},
});
