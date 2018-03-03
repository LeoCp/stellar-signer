
import React, { Component } from 'react';
import {
		View,
		Alert
	} from 'react-native';
import Modal from 'react-native-modal';
import uuid from "uuid/v4";
import { observer, inject } from "mobx-react";
import base64 from 'base-64';
import base64js from 'base64-js';
import crypto from 'crypto-js/pbkdf2';
import Icon from 'react-native-vector-icons/FontAwesome';
import Button from 'react-native-micro-animated-button';
import { Screen, Container, Header, Title, LoadButton, TextInput, ErrorLabel, CloseButton, Card, CardRow, CardLabel, CardTitle } from './../shared'
import SecretList from './../modules/secrets/SecretList';
import saltStore from './../store/salt';
import getSecretStore from './../store/secrets';

@inject("appStore") @observer
class SecretsScreen extends Component {

	state = {
		sk: undefined,
		alias: undefined,
		hasError: false
	}

	componentDidMount() {
		this.getSecrets();
	}

	toggleAddModal = () => {
    const { appStore } = this.props;
    appStore.set('isAddSecretModalVisible', !appStore.get('isAddSecretModalVisible'));
	}

	handleInputErrors = () => {
		const { sk, alias } = this.state;
	}
	
	addSecretToStore = ()=> {
		const { sk, alias } = this.state;
		if (!sk || !alias) {
			this.setState({ hasError: true });
			this.addSecretButton.error();
			this.addSecretButton.reset();
		} else {
			this.addSecretButton.success();
			this.toggleAddModal();
			this.saveSecret({ sk, alias });
			this.setState({ hasError: false, sk: undefined, alias: undefined });
		}
	}

	getSecrets = ()=> {
		const saltObject = saltStore.objects('Salt')[0];
		if (saltObject) {
			const salt = JSON.parse(saltObject.value);
			// Todo ask the Passphrase to the user
			const passcode = crypto("Secret Passphrase", salt, { keySize: 512/64 })
			const encoded = base64.encode(passcode.toString());
			const secret = base64js.toByteArray(encoded);
			const { realm } = this.state;
			if (!realm) {
				const realm = getSecretStore(secret);
				this.setState({ realm });
			}
		}
	}

	saveSecret = (secret) => {
		const { realm } = this.state;
		if (realm) {
			realm.write(() => {
				realm.create('Secret', { id: uuid(), createdAt: new Date(), ...secret });
			});
		}
	}

	deleteSecret = (item)=> {
		const { realm } = this.state;
    setTimeout(()=> {
      realm.write(() => {
        realm.delete(item);
      });
    }, 100);
	}
	
	showSecretAlert = (item) => {
		Alert.alert(
			`${item.alias}`,
			`${item.sk}`,
			[
				{text: 'Delete', onPress: () => this.deleteSecret(item), style: 'cancel'},
				{text: 'Cancel', onPress: () => { }}, // Do not button
			],
			{ cancelable: false }
		)
	}


  render() {
		const { appStore } = this.props;
		const { sk, alias, hasError } = this.state;
		const isAddSecretModalVisible = appStore.get('isAddSecretModalVisible');
		
    return (
      <Screen>
        <Header>
          <Title>My Secrets</Title>
					<LoadButton onPress={this.toggleAddModal}>
              <Icon name="plus-circle" color="white" size={32}></Icon>
          </LoadButton>
        </Header>
				<SecretList show={this.showSecretAlert} />
				<Modal isVisible={isAddSecretModalVisible}>
					<Container>
						<CloseButton onPress={this.toggleAddModal}>
              <Icon name="times-circle" color="white" size={32}></Icon>
            </CloseButton>
						<Card>
							<TextInput placeholder="Label" onChangeText={(alias)=> this.setState({ alias })} clearButtonMode={'always'} value={alias} />
							<TextInput placeholder="Secret" onChangeText={(sk)=> this.setState({ sk })} clearButtonMode={'always'} value={sk} />
							<View>
							{ hasError && (<ErrorLabel>Invalid secret or alias.</ErrorLabel>)	}
							</View>
						</Card>
						<Button 
							ref={ref => (this.addSecretButton = ref)}
							foregroundColor={'#4cd964'}
							onPress={this.addSecretToStore}
							successIconName="check" 
							label="Save"
							maxWidth={100}
							style={{ marginLeft: 16 }}
						/> 
					</Container>
				</Modal>
      </Screen>
    )
  }
}

export default SecretsScreen;