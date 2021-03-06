import React, { Component, Fragment } from 'react'
import { View, Text, Alert, Clipboard } from 'react-native'
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view'
import Button from 'react-native-micro-animated-button'
import Icon from 'react-native-vector-icons/FontAwesome'
import ActionSheet from 'react-native-actionsheet'
import { observer, inject } from 'mobx-react'

import DisplayTab from './DisplayTab'
import ErrorMessage from './ErrorMessage'
import EnvelopTab from './EnvelopTab'
import SecurityForm from './SecurityForm'
import { Container, SelectSecret } from './utils'

@inject('appStore')
@observer
class TransactionDetail extends Component {
  state = {
    tabView: {
      index: 0,
      routes: [
        { key: 'display', title: 'Operation' },
        { key: 'envelop', title: 'Envelope' },
        { key: 'signed', title: 'Signed' }
      ]
    },
    showSecurityForm: false
	}
	
	copyToClipboard = () => {
		const { tx } = this.props
		Clipboard.setString(tx.sxdr);
		this.copyButton.success();
		setTimeout(()=> this.props.toggleModal(), 1000);
	}

  handleTabIndexChange = index => {
    this.setState({
      tabView: Object.assign({}, this.state.tabView, {
        index
      })
    })
  }

  signTransaction = () => {
    this.signButton.success()
    this.setState({ showSecurityForm: true })
  }

  authTransaction = pwd => {
		const { appStore } = this.props
		const secretList = appStore.get('secretList')
		if (!secretList || secretList.length === 0) {
			Alert.alert(
				`You don't have any secret!`,
				`Please, add a new secret on the secrets tab.`,
				[
					{
						text: 'Ok',
						onPress: () => this.props.toggleModal()
					}
				]
			)
		} else {
			this.actionSheet.show();
		}
	}
	
	renderTabHeader = props => {
    return (
      <TabBar
        {...props}
        style={{ backgroundColor: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8  }}
        labelStyle={{ color: 'black' }}
        indicatorStyle={{ backgroundColor: '#00c400' }}
        scrollEnabled={true}
      />
    )
  }

  rejectTransaction = () => {
    this.cancelButton.success()
    this.props.cancelTransaction()
  }

  renderActionBar = () => {
    const { tx } = this.props
    if (!tx) {
      return
    }

    if (tx.status === 'SIGNED') {
      return (
				<View>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'center',
							padding: 16,
							backgroundColor: 'blue',
							borderBottomLeftRadius: 8,
							borderBottomRightRadius: 8
						}}
					>
						<Text style={{ color: 'white', fontWeight: '700' }}>SIGNED</Text>
        	</View>
					<Button
							ref={ref => (this.copyButton = ref)}
							foregroundColor={'white'}
							backgroundColor={'#454545'}
							successColor={'#4cd964'}
							errorColor={'#ff3b30'}
							errorIconColor={'white'}
							successIconColor={'white'}
							shakeOnError={true}
							successIconName="check"
							label="Copy Signed XDR"
							onPress={this.copyToClipboard}
							maxWidth={150}
							style={{
								marginLeft: 16,
								borderWidth: 0,
								alignSelf: 'center',
								marginTop: 16
							}}
						/>
				</View>
      )
    }

    if (tx.status === 'REJECTED') {
      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: '#ff3b30',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>REJECTED</Text>
        </View>
      )
    }

    if (tx.status === 'SUBMITTED') {
      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: '#ff8300',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>SUBMITTED</Text>
        </View>
      )
    }

    if (tx.status === 'CONFIRMED') {
      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: '#4cd964',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>CONFIRMED</Text>
        </View>
      )
    }

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Button
          ref={ref => (this.cancelButton = ref)}
          foregroundColor={'#ff3b30'}
          onPress={this.rejectTransaction}
          successIconName="check"
          label="Reject"
          maxWidth={100}
        />
        <Button
          ref={ref => (this.signButton = ref)}
          foregroundColor={'#4cd964'}
          onPress={this.signTransaction}
          successIconName="check"
          label="Sign"
          maxWidth={100}
          style={{ marginLeft: 16 }}
        />
      </View>
    )
  }

  renderTab = (route, tx) => {
    switch (route.key) {
      case 'display':
        return <DisplayTab tx={tx} />
      case 'envelop':
        return <EnvelopTab tx={tx.xdr} />
      case 'signed':
        return <EnvelopTab tx={tx.sxdr} />
      default:
        return null
    }
  }

  deleteTransaction = () => {
    const { appStore, deleteTransaction } = this.props
    const currentTransaction = appStore.get('currentTransaction')
    this.deleteTransactionButton.success()
    appStore.set('isDetailModalVisible', !appStore.get('isDetailModalVisible'))
    setTimeout(() => {
			deleteTransaction(currentTransaction);
      appStore.set('currentTransaction', undefined)
    }, 800)
  }

  getOptions = () => {
    const { appStore } = this.props
		const secretList = appStore.get('secretList')
		//console.warn('secretList',secretList)
		let options = []
		if (secretList) {
			secretList.forEach(el => options.push(el.alias))
			return options;
		}
		return undefined
  }

  submitSignature = index => {
    const { appStore } = this.props
    const secretList = appStore.get('secretList')
    const secret = secretList[index]
    this.showConfirmSignatureAlert(secret)
  }

  showConfirmSignatureAlert = secret => {
    Alert.alert(
      `${secret.alias}`,
      `${secret.sk.slice(1, 8)}...${secret.sk.substr(secret.sk.length - 8)}`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => this.props.signTransaction(secret.sk)
        } // Do not button
      ],
      { cancelable: true }
    )
  }

  render() {
    const { appStore, tx, toggleModal } = this.props
    const { showSecurityForm } = this.state
    const secretOptions = this.getOptions()
    if (!tx) {
      return <View />
    }

    if (tx.type === 'error') {
      return (
        <Container>
          <ErrorMessage tx={tx} />
          <Button
            ref={ref => (this.deleteTransactionButton = ref)}
            foregroundColor={'white'}
            backgroundColor={'#ff3b30'}
            errorColor={'#ff3b30'}
            errorIconColor={'white'}
            successIconColor={'white'}
            onPress={this.deleteTransaction}
            successIconName="check"
            label="Delete"
            maxWidth={100}
            style={{ marginLeft: 16, borderWidth: 0, alignSelf: 'center' }}
          />
        </Container>
      )
    }

    if (tx) {
      return (
        <Container
          style={{
            height: '80%',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            margin: 8,
            borderRadius: 8
          }}
        >
          {/**<ActivityIndicator size="large" color="#4b9ed4"></ActivityIndicator> **/}
          {!showSecurityForm && (
            <TabViewAnimated
              navigationState={this.state.tabView}
              renderScene={({ route }) => this.renderTab(route, tx)}
              renderHeader={this.renderTabHeader}
              onIndexChange={this.handleTabIndexChange}
            />
          )}
          {!showSecurityForm && this.renderActionBar()}
          {showSecurityForm && (
            <SecurityForm
              submit={this.authTransaction}
              close={toggleModal}
              closeAfterSubmit={false}
            />
					)}
					{(secretOptions && secretOptions.length > 0) && (
						<ActionSheet
							ref={o => (this.actionSheet = o)}
							title={'Select a Secret'}
							options={secretOptions}
							cancelButtonIndex={1}
							destructiveButtonIndex={2}
							onPress={this.submitSignature}
						/>
					)}
        </Container>
      )
    }

    return <View />
  }
}

export default TransactionDetail
