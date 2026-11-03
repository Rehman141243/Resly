import { Text, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { TemplateInfo } from "../../types/resume";

export default function TemplateBadges({
  item,
  locked,
  watched = 0,
  required = 3,
  showLock = true,
}: {
  item: TemplateInfo;
  locked: boolean;
  /** Rewarded ads already watched for this template. */
  watched?: number;
  /** Rewarded ads needed to unlock it. */
  required?: number;
  showLock?: boolean;
}) {
  return (
    <>
      {showLock ? (
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: !item.adUnlockable ? "#8E8E93" : locked ? "#F5A623" : "#34C759",
            borderRadius: 8,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}
        >
          <Ionicons name={locked ? "lock-closed" : "checkmark-circle"} size={10} color="#FFFFFF" />
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: 0.4,
              marginLeft: 3,
            }}
          >
            {!item.adUnlockable
              ? "LOCKED"
              : locked
                ? watched > 0
                  ? `${watched}/${required} ADS`
                  : `${required} ADS`
                : "UNLOCKED"}
          </Text>
        </View>
      ) : null}
      {item.hasPhoto ? (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.65)",
            borderRadius: 8,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff", letterSpacing: 0.4 }}>
            PHOTO
          </Text>
        </View>
      ) : null}
    </>
  );
}
