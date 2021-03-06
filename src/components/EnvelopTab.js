import React from 'react'
import styled from 'styled-components'
import { WebView, View, Text, ScrollView} from 'react-native'
import TreeView from './TreeView';
import { decodeFromXdr } from './../utils/xdrUtils';

const Container = styled.View`
  flex: 1;
	background-color: white;
`
export default ({ tx }) => {
  if (tx) {
		const decoded = decodeFromXdr(tx, 'TransactionEnvelope');
		console.log('decoded',decoded)
    return (
      <Container>
				<ScrollView>
        	<TreeView nodes={decoded.tx}></TreeView>
				</ScrollView>
      </Container>
    );
	}
	
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white'}}>
      <Text>Transaction not signed!</Text>
    </View>
  )
}