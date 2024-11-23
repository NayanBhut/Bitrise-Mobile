import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
} from 'react-native';
import ApiService from '../../API Calls/APIService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../APIConstants/APIConstants';

export interface CustomKeyModel {
  id: string;
  keyName: string;
  keyValue: string;
}

type BuildTriggerModalProps = {
  slug: string;
  visible: boolean;
  isAbortVisible: boolean;
  abortBuild: (abort: boolean, reason: string) => void;
  cancel: (status: boolean) => void;
};

const BuildTriggerModal = (props: BuildTriggerModalProps) => {
  const [data, setData] = useState<CustomKeyModel[]>([]);
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [editingItem, setEditingItem] = useState<CustomKeyModel | null>(null);
  const [branchName, setBranchName] = useState('');
  const [workFlowValue, setWorkFlowValue] = useState('');
  const [abortReason, setAbortReason] = useState('');

  // Add new data
  const addData = () => {
    if (!keyName || !keyValue) {
      Alert.alert('Error', 'Please provide both Key Name and Key Value');
      return;
    }

    const newData: CustomKeyModel = {
      id: Math.random().toString(),
      keyName: keyName,
      keyValue: keyValue,
    };

    setData(prevData => [...prevData, newData]);
    resetForm();
  };

  // Edit existing data
  const editData = (item: CustomKeyModel) => {
    setEditingItem(item);
    setKeyName(item.keyName);
    setKeyValue(item.keyValue);
  };

  // Save edited data
  const saveEditedData = () => {
    if (!keyName || !keyValue) {
      Alert.alert('Error', 'Please provide both Key Name and Key Value');
      return;
    }

    const updatedData = data.map(item =>
      item.id === editingItem?.id ? {...item, keyName, keyValue} : item,
    );

    setData(updatedData);
    resetForm();
  };

  // Reset form fields
  const resetForm = () => {
    setKeyName('');
    setKeyValue('');
    setEditingItem(null); // Reset editing state
  };

  async function triggerBuid() {
    const auth: string | null = await AsyncStorage.getItem('token');
    if (auth === null) {
      return;
    }

    const arrEnvData = data.map(item => {
      return {
        mapped_to: item.keyName,
        value: item.keyValue,
        is_expand: true,
      };
    });

    const myHeaders = new Headers();
    myHeaders.append('accept', 'application/json');
    myHeaders.append('Authorization', auth);
    myHeaders.append('Content-Type', 'application/json');

    // const raw = JSON.stringify({
    //   hook_info: {
    //     type: 'bitrise',
    //   },
    //   build_params: {
    //     branch: branchName,
    //     workflow_id: workFlowValue,
    //     environments: arrEnvData,
    //   },
    // });

    const objTrigger = {
      hook_info: {
        type: 'bitrise',
      },
      build_params: {
        branch: branchName,
        workflow_id: workFlowValue,
        environments: arrEnvData,
      },
    };
    const url = API_CONFIG.endpoints.builds.trigger(props.slug);
    const apiService = new ApiService(API_CONFIG.BASE_URL);

    apiService
      .post(url, objTrigger, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(response => {
        var result = JSON.parse(JSON.stringify(response));
        const message =
          result.status === 'error' ? result.message : 'Build Triggered';
        Alert.alert('Build', message, [
          {
            text: 'OK',
            onPress: () => {
              props.cancel(true);
            },
          },
        ]);
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  }

  return (
    <Modal
      visible={props.visible || props.isAbortVisible}
      animationType="slide"
      transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {props.isAbortVisible ? (
            <View style={styles.modalContainer}>
              <Text style={styles.abortReasonText}>Add abort Reason</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                spellCheck={false}
                style={styles.input}
                placeholder="Please add reason"
                placeholderTextColor="black"
                value={abortReason}
                onChangeText={setAbortReason}
              />
              <View style={styles.viewModalButton}>
                <TouchableOpacity
                  onPress={() => {
                    props.abortBuild(false, abortReason);
                  }}
                  style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    props.abortBuild(true, abortReason);
                  }}
                  style={styles.triggerButton}>
                  <Text style={styles.triggerText}>Abort Build</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Build Configuration</Text>

              <View style={styles.viewBranchWorkflow}>
                <Text style={styles.textBranchWorkFLow}>Branch Name</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  spellCheck={false}
                  style={styles.input}
                  placeholder="Branch Name"
                  placeholderTextColor="black"
                  value={branchName}
                  onChangeText={setBranchName}
                />

                <Text style={styles.textBranchWorkFLow}>WorkFlow Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="WorkFlow Name"
                  placeholderTextColor="black"
                  value={workFlowValue}
                  onChangeText={setWorkFlowValue}
                />
              </View>

              <Text style={styles.customKey}>
                {editingItem ? 'Edit Keys' : 'Add Custom Keys'}
              </Text>

              {/* Form Inputs */}
              <TextInput
                style={styles.input}
                placeholder="Enter Key Name"
                placeholderTextColor="black"
                value={keyName}
                onChangeText={setKeyName}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Key Value"
                placeholderTextColor="black"
                value={keyValue}
                onChangeText={setKeyValue}
              />

              {/* Add or Save Button */}
              <Button
                title={editingItem ? 'Save Changes' : 'Add Custom Keys'}
                onPress={editingItem ? saveEditedData : addData}
              />

              {/* List of Data */}
              <FlatList
                data={data}
                keyExtractor={item => item.id}
                style={styles.styleFlatList}
                renderItem={({item}) => (
                  <View style={styles.listItem}>
                    <Text style={styles.itemText}>
                      {item.keyName}: {item.keyValue}
                    </Text>
                    <View style={styles.listItemActions}>
                      <TouchableOpacity
                        onPress={() => editData(item)}
                        style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />

              {/* Close Modal Button */}
              <View style={styles.viewModalButton}>
                <TouchableOpacity
                  onPress={() => {
                    props.cancel(false);
                  }}
                  style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={triggerBuid}
                  style={styles.triggerButton}>
                  <Text style={styles.triggerText}>Trigger Build</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  customKey: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
    color: 'black',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
    color: 'black',
  },
  itemText: {
    fontSize: 16,
    color: 'black',
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    marginRight: 20,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  triggerButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  triggerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  viewBranchWorkflow: {
    width: '100%',
  },
  textBranchWorkFLow: {
    marginBottom: 10,
    color: 'black',
  },
  viewModalButton: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  styleFlatList: {
    maxHeight: 100,
    minHeight: 0,
    flexGrow: 0,
    flexDirection: 'column',
  },
  abortReasonText: {
    fontWeight: '600',
    fontSize: 20,
    paddingBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
});

export default BuildTriggerModal;
