import React, { Component } from 'react'
import { View, Alert, Dimensions, KeyboardAvoidingView, SafeAreaView } from 'react-native'
import Modal from 'react-native-modal'
import uuid from 'uuid/v4'
import { observer, inject } from 'mobx-react'
import base64 from 'base-64'
import base64js from 'base64-js'
import crypto from 'crypto-js/pbkdf2'
import Icon from 'react-native-vector-icons/Feather'
import Button from 'react-native-micro-animated-button'

import SecretList from '../components/SecretList'
import {
  Screen,
  ContainerFlex,
  Header,
  Title,
  LoadButton,
  TextInput,
  ErrorLabel,
  CloseButton,
  CardFlex,
  CardRow,
  CardLabel,
	CardTitle,
	LoadButtonWrapper,
	TitleWrapper
} from '../components/utils'

import PouchDB from 'pouchdb-react-native'
import SQLite from 'react-native-sqlite-2'
import SQLiteAdapterFactory from 'pouchdb-adapter-react-native-sqlite'
const SQLiteAdapter = SQLiteAdapterFactory(SQLite)
PouchDB.plugin(SQLiteAdapter)
const db = new PouchDB('Secrets', { adapter: 'react-native-sqlite' })

@inject('appStore')
@observer
class SecretsScreen extends Component {
  state = {
    sk: undefined,
    alias: undefined,
    hasError: false,
    secrets: []
  }

  componentDidMount() {
		// this.getSecrets()
		this.loadData();
	}
	
	loadData = () => {
		let self = this;
		db.allDocs({
			include_docs: true
		}).then((res)=> {
			self.setState({ secrets: res.rows, isLoadingList: false });
		})
	}

	getSecrets = () => {
    // const { appStore } = this.props
    // const saltObject = store.objects('Salt')[0]
    // try {
    //   if (saltObject) {
    //     const pwd = appStore.get('pwd')
    //     if (pwd) {
    //       const salt = JSON.parse(saltObject.value)
    //       const passcode = crypto(pwd, salt, { keySize: 512 / 64 })
    //       const encoded = base64.encode(passcode.toString())
    //       const secret = base64js.toByteArray(encoded)
    //       const { realm } = this.state
    //       if (!realm) {
    //         const secretStore = getSecretStore(secret)
    //         const secrets = secretStore.objects('Secret').sorted('alias', true)
    //         secretStore.addListener('change', this.getSecrets)
    //         this.setState({ realm: secretStore, secrets })
    //       } else {
    //         const secrets = realm.objects('Secret').sorted('alias', true)
    //         realm.addListener('change', this.getSecrets)
    //         this.setState({ realm, secrets })
    //       }
    //     } else {
    //       alert('Ask Password')
    //     }
    //   }
    // } catch (error) {
    //   if (error.message.includes('Unable to open a realm at path')) {
    //     alert('Invalid secret!')
    //   } else {
    //     alert(error.message)
    //   }
    // }
  }

  toggleAddModal = () => {
    const { appStore } = this.props
    appStore.set(
      'isAddSecretModalVisible',
      !appStore.get('isAddSecretModalVisible')
    )
  }

  handleInputErrors = () => {
    const { sk, alias } = this.state
  }

  addSecretToStore = () => {
    const { sk, alias } = this.state
    if (!sk || !alias) {
      this.setState({ hasError: true })
      this.addSecretButton.error()
      this.addSecretButton.reset()
    } else {
      this.addSecretButton.success()
      this.toggleAddModal()
      this.saveSecret({ sk, alias })
      this.setState({ hasError: false, sk: undefined, alias: undefined })
    }
  }

  saveSecret = secret => {
		try {
			db.put({
				_id: uuid(),
				...secret,
				createdAt: new Date().toISOString()
			});
			this.loadData();
		} catch (error) {
			alert(error.message)
		}				
  }

  deleteSecret = async doc => {
		try {
			const res = await db.remove(doc);
			this.loadData();
		} catch (error) {
			alert(error.message);
		}
  }

  showSecretAlert = item => {
    Alert.alert(
      `${item.alias}`,
      `${item.sk}`,
      [
        {
          text: 'Delete',
          onPress: () => this.deleteSecret(item),
          style: 'cancel'
        },
        { text: 'Close', onPress: () => {} } // Do not button
      ],
      { cancelable: false }
    )
  }

  render() {
    const { appStore } = this.props
    const { sk, alias, hasError, secrets } = this.state
    const isAddSecretModalVisible = appStore.get('isAddSecretModalVisible')

    return (
			<SafeAreaView style={{ backgroundColor: 'blue' }}>
				<Screen>
					<Header>
							<TitleWrapper>
								<Title>My Secrets</Title>
								</TitleWrapper>
								<LoadButtonWrapper>
								<LoadButton onPress={this.toggleAddModal}>
									<Icon name="plus-circle" color="white" size={32} />
								</LoadButton>
						</LoadButtonWrapper>					
					</Header>
					<SecretList secrets={secrets} show={this.showSecretAlert} />
					<Modal isVisible={isAddSecretModalVisible}>
						<SafeAreaView style={{ flex: 1 }}>
							<ContainerFlex>
								<CloseButton onPress={this.toggleAddModal}>
									<Icon name="x-circle" color="white" size={32} />
								</CloseButton>
								<CardFlex>
									<TextInput
										placeholder="Label"
										onChangeText={alias => this.setState({ alias })}
										clearButtonMode={'always'}
										underlineColorAndroid={'white'}
										value={alias}
									/>
									<TextInput
										placeholder="Secret Key"
										onChangeText={sk => this.setState({ sk })}
										clearButtonMode={'always'}
										underlineColorAndroid={'white'}
										value={sk}
									/>
									<View>
										{hasError && <ErrorLabel>Invalid secret or label.</ErrorLabel>}
									</View>
								</CardFlex>
								<KeyboardAvoidingView>
									<View style={{ alignSelf: 'center', paddingTop: 8 }}>
										<Button
											ref={ref => (this.addSecretButton = ref)}
											foregroundColor={'#4cd964'}
											onPress={this.addSecretToStore}
											foregroundColor={'white'}
											backgroundColor={'#4cd964'}
											successColor={'#4cd964'}
											errorColor={'#ff3b30'}
											errorIconColor={'white'}
											successIconColor={'white'}
											successIconName="check"
											label="Save"
											maxWidth={100}
											style={{ borderWidth: 0 }}
										/>
									</View>
								</KeyboardAvoidingView>
							</ContainerFlex>
						</SafeAreaView>
					</Modal>
				</Screen>
			</SafeAreaView>
    )
  }
}

export default SecretsScreen
