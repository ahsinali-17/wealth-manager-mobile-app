import { COLORS } from "@/constants/theme";
import {
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useUpdateAccountMutation,
} from "@/hooks/mutations/useAccountMutation";
import { Account, AccountType } from "@/lib/services/accounts";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import FormSheetModal from "./FormSheetModal";
import PillGroup from "./PillGroup";

const Account_Type_Options: Array<{ key: AccountType; label: string }> = [
  {
    label: "Bank",
    key: "BANK",
  },
  {
    label: "Credit Card",
    key: "CREDIT_CARD",
  },
  {
    label: "Cash",
    key: "CASH",
  },
  {
    label: "Savings",
    key: "SAVINGS",
  },
];

export default function AccountModal({
  account,
  onSetDefault,
  visible,
  onClose,
}: {
  account: Account | null;
  onSetDefault: (account: Account) => void;
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [submitText, setSubmitText] = useState<"Save" | "Update" | "Delete">(
    "Save",
  );
  const [error, setError] = useState("");

  const { mutateAsync: updateAccount, isPending } = useUpdateAccountMutation();
  const { mutateAsync: createAccount, isPending: isCreating } =
    useCreateAccountMutation();
  const { mutateAsync: deleteAccount, isPending: isDeleting } =
    useDeleteAccountMutation();

  const isLoading = isCreating || isPending || isDeleting;

  const handleCreate = async () => {
    if (!name || !type) {
      setError("Please fill all the fields");
      return;
    }
    try {
      await createAccount({
        name,
        type,
      });
      onClose();
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const handleUpdate = async () => {
    if (!account) return;
    try {
      await updateAccount({
        account_id: account.id,
        name,
        type,
      });
      onClose();
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!account) {
      return;
    }
    if (account?.is_default) {
      Alert.alert(
        "Action Required",
        "Cannot delete default account. Please set another account as default before deleting.",
      );
      setSubmitText("Save");
      onClose();
      return;
    }
    try {
      const res = await deleteAccount({
        account_id: account.id,
      });
      if (res && res.transactionCount > 0) {
        Alert.alert(
          "Confirmation",
          `This action will remove ${res.transactionCount} transaction(s) associated with this account. Are you sure you want to delete?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setSubmitText("Save");
                onClose();
              },
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteAccount({
                    account_id: account.id,
                    force: true,
                  });
                  setSubmitText("Save");
                  onClose();
                } catch (err: any) {
                  setError(err?.message || "Failed to delete account");
                }
              },
            },
          ],
        );
        return;
      }
      setSubmitText("Save");
      onClose();
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  const isEditing = !!account;

  useEffect(() => {
    if (visible) {
      if (account) {
        setName(account.name);
        setType(account.type);
        setSubmitText("Update");
      } else {
        setName("");
        setType("BANK");
        setSubmitText("Save");
      }
      setError("");
    }
  }, [account, visible]);

  return (
    <FormSheetModal
      title={!!account ? "Edit Account" : "Add Account"}
      visible={visible}
      onClose={() => {
        setError("");
        setSubmitText("Save");
        onClose();
      }}
    >
      {isEditing && (
        <View className="flex-row justify-between w-full items-center mt-2">
          <TouchableOpacity
            className="flex-row gap-2 items-center bg-brand-coral/10 px-3 py-2 rounded-xl "
            onPress={() => {
              setSubmitText("Delete");
            }}
          >
            <Feather name="trash" size={20} color={COLORS.coral} />
            <Text className="text-brand-bg text-base">Delete Account</Text>
          </TouchableOpacity>
          {!account?.is_default && (
            <TouchableOpacity
              className="flex-row gap-2 items-center bg-brand-blue/10 px-3 py-2 rounded-xl "
              onPress={() => {
                if (account) {
                  setSubmitText("Save");
                  setError("");
                  onSetDefault(account);
                }
              }}
            >
              <Feather name="star" size={20} color={COLORS.blue} />
              <Text className="text-brand-bg text-base">Make Default</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text className="text-brand-bg text-base mt-3 mb-1.5">Account Name</Text>

      <TextInput
        style={{
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 10,
          marginBottom: 15,
        }}
        placeholder="e.g. JazzCash, HBL, Easypaisa"
        placeholderTextColor={COLORS.placeholder}
        keyboardType="default"
        autoFocus
        value={name}
        onChangeText={(text) => {
          setName(text);
        }}
      />

      <Text className="text-brand-bg text-base mb-1.5">Account Type</Text>

      <PillGroup
        elements={Account_Type_Options}
        currentValue={type}
        onChange={(value) => setType(value as AccountType)}
      />

      {error && <Text className="text-red-500 my-2">{error}</Text>}

      <TouchableOpacity
        onPress={
          submitText === "Delete"
            ? handleDelete
            : submitText === "Update"
              ? handleUpdate
              : handleCreate
        }
        disabled={isLoading}
        className={`w-full ${submitText === "Delete" ? "bg-brand-coral" : submitText === "Update" ? "bg-brand-blue/70" : "bg-brand-bg"} py-4 rounded-xl items-center mt-6 mb-2`}
      >
        <Text className="text-brand-body text-base font-semibold">
          {isLoading
            ? submitText === "Delete"
              ? "Deleting..."
              : submitText === "Update"
                ? "Updating..."
                : "Creating..."
            : submitText}
        </Text>
      </TouchableOpacity>
    </FormSheetModal>
  );
}
