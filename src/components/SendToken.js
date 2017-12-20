import React, { Component } from 'react';
import { Button, Image, View, ScrollView, Text, TextInput, AsyncStorage, StyleSheet } from 'react-native';
import ethers from 'ethers';
import Connector from './Connector.js';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BirdlandToken from '../contracts/BirdlandToken.json';
wallet = '';

class SendToken extends React.Component {
  static navigationOptions = {
	title: 'Transfer Tokens',
	tabBarLabel: 'Token'
  };

	constructor(props) {
	    super(props);

		this.state = {
			hasWallet: false,
			ethBalance: '',
			tokenName: '',
			tokenBalance: '',
			tokenSymbol: '',
			tokenAddress: '',
			detInputAmount: '',
			nonce: '',
			submitMessage: '',
			toAddress: '0xd9415fa2285D8fAE7BCC9C9EA0603edA66f5D0C9',
			message: '',
			isSigned: false,
			isTransferSuccess: false,
		};
  	}

  	getWalletInfo = async () => {
		try {
			const self = this;
			let mnemonic = await AsyncStorage.getItem('mnemonic');
			self.setState({hasWallet: true});
			self.setState({walletAddress: wallet.address});
			wallet.provider = etherscanProvider;
			const tokenAddress = daTokenAddress;
			contract = new ethers.Contract(tokenAddress, BirdlandToken, etherscanProvider);
			contract.connect(etherscanProvider);
			let tokenBalance = 0;
			let tokenName = '';
			let tokenSymbol = '';
			let txCount = 0;

			//name
			contract.name().then(function(result){
				tokenName = result[0];
				self.setState({tokenName: tokenName});
			});
			//symbol
			contract.symbol().then(function(result){
				let tokenSymbol = result[0];
				self.setState({tokenSymbol: tokenSymbol});
			});

			if (wallet) {
				//token balance
				const tokenData = "0x70a08231000000000000000000000000" + wallet.address.substr(2); //
				etherscanProvider.call({
					to: tokenAddress,
					data: tokenData
				}).then(function(result) {
					tokenBalance = ethers.utils.bigNumberify(result);
					self.setState({tokenBalance: tokenBalance.toString()});
					if (tokenBalance <= 0) {
						self.setState({message: "You have insufficient amount of tokens to send."})
					}
				});

				//transaction number
				let tranactionCount = wallet.getTransactionCount('latest'); //nonce
				tranactionCount.then(function(count) {
					txCount = count;
					self.setState({nonce: txCount.toString()});
				});
			}
		}
		catch(error) {
			this.setState({hasWallet: false});
			this.setState({message: error});
		}
	}

	componentWillMount() {
		let self = this;
		self.getWalletInfo();
		const tokenAddress = daTokenAddress;
		self.setState({tokenAddress: tokenAddress});
	}

	calcAmountString(inputAmount) {
		let self = this;
		const functionString = "0xa9059cbb000000000000000000000000";
		let toAddressString = self.state.toAddress.substr(2);
		let amountBN = ethers.utils.bigNumberify(inputAmount);
		let amountHex = amountBN.toHexString();
		let s = "0000000000000000000000000000000000000000000000000000000000000000" + amountHex.substr(2);
		let newLength = s.length-64;
		let zeroString = s.substr(newLength);
		let dataString = functionString + toAddressString + zeroString;
		return dataString;
	}

	emitSend() {
		let self = this;
		wallet.provider = etherscanProvider;
		let nonce = self.state.nonce;
		let amount = self.state.detInputAmount;
		const tokenAddress = daTokenAddress;
		let transactionHash;

		const transaction = {
			from: wallet.address,
			to: tokenAddress,
			value: '0x00',
			nonce: ethers.utils.bigNumberify(nonce),
			gasPrice: ethers.utils.bigNumberify(20000000000),
			gasLimit: ethers.utils.bigNumberify(100000),
			data: this.calcAmountString(amount),
		}
		let signedTransaction = wallet.sign(transaction);
		//let parsedTransaction = ethers.Wallet.parseTransaction(signedTransaction);
		self.setState({isSigned: true});
		wallet.provider.sendTransaction(signedTransaction).then(function(hash) {
			transactionHash = hash;
			etherscanProvider.waitForTransaction(transactionHash).then(function(transaction) {
				self.setState({isSigned: false});
				self.setState({isTransferSuccess: true});
				self.setState({submitMessage: transaction.hash});
				self.getWalletInfo();
			});
		});
		
	}

  render() {
    return (
      <ScrollView style={styles.container}>
		<Text style={styles.baseText}>
			<Image source={require('../img/beeldmerk_30x32_darkblue.png')} style={{width: 120, height: 128}} />
			<Text style={styles.header_h4}> Send Tokens{'\n'}{'\n'}</Text>
			<Text style={styles.prompt}>Name: </Text>
			<Text>{this.state.tokenName}{'\n'}</Text>
			<Text style={styles.prompt}>Nonce: </Text>
			<Text>{this.state.nonce}{'\n'}</Text>
			<Text style={styles.prompt}>Your Balance: </Text>
			<Text>{this.state.tokenSymbol} {this.state.tokenBalance}{'\n'} {'\n'}</Text>
			<Text style={styles.prompt}>Send tokens to address: </Text>
			<Text>{'\n'}</Text>
		</Text>
		<TextInput
			style={styles.input}
			defaultValue = {this.state.toAddress}
			underlineColorAndroid = "transparent"
			autoFocus = {true}
			selectable = {true}
			selectTextOnFocus = {true}
			maxLength = {80}
			placeholderTextColor = "#A0B5C8"
			onChangeText = {(toAddress) => this.setState({toAddress})}
			/*value = {}*/
		/>
		<TextInput
			style={styles.input}
			underlineColorAndroid = "transparent"
			placeholder = "Minimum 1 DET"
			placeholderTextColor = "#A0B5C8"
			keyboardType={'numeric'}
			maxLength={10}
			blurOnSubmit={true}
			onChangeText={(detInputAmount) => this.setState({detInputAmount})}
			value={this.state.detInputAmount} 
		/>
		<Button 
			color="#BCB3A2"
			title="Submit"
			accessibilityLabel="Submit"
			onPress = { ()=> this.emitSend()}
		/>
		<Text style={styles.baseText}>{'\n'}
			{this.state.isSigned && <Text><Ionicons name={'ios-cog-outline'} size={26} style={styles.icon} /> Just a minute. Your transaction will be mined now...</Text>}
			{this.state.isTransferSuccess && <Text style={styles.prompt}>Hash is mined:{'\n'} </Text>}
			{this.state.isTransferSuccess && <Text>{this.state.submitMessage}{'\n'}</Text>}
			<Text style={styles.errorText}>{this.state.message}{'\n'}</Text>
		</Text>
      </ScrollView>

    );
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
  },
  header_h4: {
    color: '#2D4866',
    fontSize: 20,
    padding: 10,
  },
  baseText: {
    textAlign: 'left',
    color: '#999999',
    marginBottom: 5,
    marginLeft: 10,
  },
  input: {
    height: 40, 
    borderColor: '#D3C8B2', 
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 15,
    color: '#999999',
  },
  prompt: {
    color: '#BCB3A2',
  },
  errorText: {
    marginTop: 10,
    color: 'red'
  },
  icon: {
    color: '#2D4866',
    fontSize: 30,
  },
});

export default SendToken;